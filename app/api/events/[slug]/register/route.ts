import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

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
    const registration = await prisma.$transaction(async (tx) => {
      const claimed = await tx.event.updateMany({
        where: { id: event.id, seatsFilled: { lt: event.seatsTotal } },
        data: { seatsFilled: { increment: 1 } },
      });

      if (claimed.count === 0) {
        throw new Error("EVENT_FULL");
      }

      return tx.eventRegistration.upsert({
        where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
        update: { status: "CONFIRMED", amount: event.fee },
        create: {
          userId: session.user.id,
          eventId: event.id,
          amount: event.fee,
          status: "CONFIRMED",
        },
      });
    });

    return NextResponse.json(registration, { status: 201 });
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
