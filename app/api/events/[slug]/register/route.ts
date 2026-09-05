import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withEnrollmentNumber, buildGoogleFormUrl } from "@/lib/enrollment";
import { sendEventRegistrationConfirmationEmail } from "@/lib/email";
import { notifyNextWaitlisted, leaveEventWaitlist } from "@/lib/waitlist";
import { hasCompletedOnboarding } from "@/lib/onboarding";

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

  const existing = await prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
  });
  if (existing?.status === "CONFIRMED") {
    return NextResponse.json({ error: "Already registered" }, { status: 409 });
  }

  try {
    const registration = await withEnrollmentNumber(existing?.enrollmentNumber, (enrollmentNumber) =>
      prisma.$transaction(async (tx) => {
        const claimed = await tx.event.updateMany({
          where: { id: event.id, seatsFilled: { lt: event.seatsTotal } },
          data: { seatsFilled: { increment: 1 } },
        });

        if (claimed.count === 0) {
          throw new Error("EVENT_FULL");
        }

        return tx.eventRegistration.upsert({
          where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
          update: { status: "CONFIRMED", amount: event.fee, certificateName, enrollmentNumber },
          create: {
            userId: session.user.id,
            eventId: event.id,
            amount: event.fee,
            status: "CONFIRMED",
            certificateName,
            enrollmentNumber,
          },
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

    await sendEventRegistrationConfirmationEmail(
      session.user.email!,
      session.user.name ?? "",
      event.title,
      event.startDate,
      event.venueOrLink,
      registration.enrollmentNumber
    ).catch((err) => console.error("Failed to send event registration confirmation email:", err));

    return NextResponse.json({ ...registration, googleFormUrl }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "EVENT_FULL") {
      return NextResponse.json({ error: "This event is full" }, { status: 409 });
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

  await prisma.$transaction(async (tx) => {
    await tx.eventRegistration.update({
      where: { id: registration.id },
      data: { status: "CANCELLED" },
    });
    // Frees the seat back up — guarded so it can never go negative.
    await tx.event.updateMany({
      where: { id: event.id, seatsFilled: { gt: 0 } },
      data: { seatsFilled: { decrement: 1 } },
    });
  });

  // Best-effort — a waitlist notification failure shouldn't undo the cancellation.
  await notifyNextWaitlisted(event.id).catch((err) =>
    console.error(`Failed to notify next waitlisted user for event ${event.id}:`, err)
  );

  return NextResponse.json({ ok: true });
}
