import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition || !competition.isPublished) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  await prisma.competitionWishlist.upsert({
    where: { userId_competitionId: { userId: session.user.id, competitionId: competition.id } },
    update: {},
    create: { userId: session.user.id, competitionId: competition.id },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  await prisma.competitionWishlist.deleteMany({
    where: { userId: session.user.id, competitionId: competition.id },
  });

  return NextResponse.json({ ok: true });
}
