import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { eventCalendarEmailLinks } from "@/lib/eventCalendar";
import { SITE_URL } from "@/lib/siteUrl";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withEnrollmentNumber, buildGoogleFormUrl } from "@/lib/enrollment";
import { sendEventRegistrationConfirmationEmail } from "@/lib/email";
import { notifyNextWaitlisted, leaveEventWaitlist } from "@/lib/waitlist";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import { registrationWindowError } from "@/lib/registrationWindow";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }
  if (!(await hasCompletedOnboarding(session.user.id, session.user.role))) {
    return NextResponse.json(
      { error: "Please complete your profile before registering.", code: "ONBOARDING_REQUIRED" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const certificateName =
    typeof body?.certificateName === "string" && body.certificateName.trim()
      ? body.certificateName.trim()
      : null;

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event || !event.isPublished) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (Number(event.fee) > 0) {
    return NextResponse.json(
      { error: "This event requires payment — use checkout instead" },
      { status: 400 }
    );
  }
  const windowError = registrationWindowError("event", {
    registrationStartDate: event.registrationStartDate,
    registrationDeadline: event.registrationDeadline,
    endDate: event.endDate,
  });
  if (windowError) {
    return NextResponse.json({ error: windowError }, { status: 400 });
  }

  const existing = await prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
  });
  if (existing?.status === "CONFIRMED") {
    return NextResponse.json({ error: "Already registered" }, { status: 409 });
  }

  try {
    const registration = await withEnrollmentNumber(existing?.enrollmentNumber, (enrollmentNumber) =>
      prisma.$transaction(async (tx) => {
        // Flip the registration first and only take a seat if this request
        // actually made it CONFIRMED — several clicks at once used to each
        // take a seat for one registration and fill the event.
        const reactivated = existing
          ? await tx.eventRegistration.updateMany({
              where: { id: existing.id, status: { notIn: ["CONFIRMED", "ATTENDED"] } },
              data: { status: "CONFIRMED", amount: event.fee, certificateName, enrollmentNumber },
            })
          : null;
        if (existing && reactivated!.count === 0) throw new Error("ALREADY_REGISTERED");
        if (!existing) {
          // A concurrent click that also creates the row hits the unique
          // (userId, eventId) constraint and is reported as already registered.
          await tx.eventRegistration.create({
            data: {
              userId: session.user.id,
              eventId: event.id,
              amount: event.fee,
              status: "CONFIRMED",
              certificateName,
              enrollmentNumber,
            },
          });
        }

        const claimed = await tx.event.updateMany({
          where: { id: event.id, seatsFilled: { lt: event.seatsTotal } },
          data: { seatsFilled: { increment: 1 } },
        });
        if (claimed.count === 0) {
          throw new Error("EVENT_FULL");
        }

        return tx.eventRegistration.findUniqueOrThrow({
          where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
        });
      })
    );

    const googleFormUrl = buildGoogleFormUrl(event, {
      name: certificateName ?? session.user.name ?? "",
      email: session.user.email ?? "",
      enrollmentNumber: registration.enrollmentNumber!,
    });

    // A now-registered user has nothing left to wait for — leave it behind so
    // they don't keep occupying a waitlist slot (and its notifications) for a
    // seat they already have.
    await leaveEventWaitlist(session.user.id, event.id).catch((err) =>
      console.error(`Failed to clear waitlist entry for user ${session.user.id} on event ${event.id}:`, err)
    );

    // A registered event no longer needs to be "saved for later".
    await prisma.eventWishlist.deleteMany({
      where: { userId: session.user.id, eventId: event.id },
    });

    await sendEventRegistrationConfirmationEmail(
      session.user.email!,
      session.user.name ?? "",
      event.title,
      event.startDate,
      event.venueOrLink,
      registration.enrollmentNumber,
      eventCalendarEmailLinks(event, SITE_URL)
    ).catch((err) => console.error("Failed to send event registration confirmation email:", err));

    return NextResponse.json({ ...registration, googleFormUrl }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "EVENT_FULL") {
      return NextResponse.json({ error: "This event is full" }, { status: 409 });
    }
    if (
      (err instanceof Error && err.message === "ALREADY_REGISTERED") ||
      (err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        !(err.meta?.target as string[] | undefined)?.includes("enrollmentNumber"))
    ) {
      return NextResponse.json({ error: "Already registered" }, { status: 409 });
    }
    console.error("Event registration failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (Number(event.fee) > 0) {
    return NextResponse.json(
      { error: "Paid registrations can't be cancelled here — contact us for a refund" },
      { status: 400 }
    );
  }

  const registration = await prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
  });
  if (!registration || registration.status !== "CONFIRMED") {
    return NextResponse.json({ error: "You're not registered for this event" }, { status: 404 });
  }

  const cancelled = await prisma.$transaction(async (tx) => {
    // Conditional, so two cancel clicks at once can't both free a seat.
    const flipped = await tx.eventRegistration.updateMany({
      where: { id: registration.id, status: "CONFIRMED" },
      data: { status: "CANCELLED" },
    });
    if (flipped.count === 0) return false;
    // Frees the seat back up — guarded so it can never go negative.
    await tx.event.updateMany({
      where: { id: event.id, seatsFilled: { gt: 0 } },
      data: { seatsFilled: { decrement: 1 } },
    });
    return true;
  });
  if (!cancelled) {
    return NextResponse.json({ error: "You're not registered for this event" }, { status: 404 });
  }

  // Best-effort — a waitlist notification failure shouldn't undo the cancellation.
  await notifyNextWaitlisted(event.id).catch((err) =>
    console.error(`Failed to notify next waitlisted user for event ${event.id}:`, err)
  );

  return NextResponse.json({ ok: true });
}
