import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { joinEventWaitlist, leaveEventWaitlist, NotFullError, AlreadyRegisteredError } from "@/lib/waitlist";

export async function POST(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event || !event.isPublished) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    await joinEventWaitlist(session.user.id, event.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof NotFullError) {
      return NextResponse.json({ error: "This event still has seats available" }, { status: 400 });
    }
    if (err instanceof AlreadyRegisteredError) {
      return NextResponse.json({ error: "You're already registered for this event" }, { status: 409 });
    }
    console.error("Joining waitlist failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
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

  await leaveEventWaitlist(session.user.id, event.id);
  return NextResponse.json({ ok: true });
}
