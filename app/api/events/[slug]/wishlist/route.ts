import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event || !event.isPublished) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  await prisma.eventWishlist.upsert({
    where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
    update: {},
    create: { userId: session.user.id, eventId: event.id },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
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

  await prisma.eventWishlist.deleteMany({
    where: { userId: session.user.id, eventId: event.id },
  });

  return NextResponse.json({ ok: true });
}
