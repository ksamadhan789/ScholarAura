import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job || !job.isPublished) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  await prisma.jobWishlist.upsert({
    where: { userId_jobId: { userId: session.user.id, jobId: job.id } },
    update: {},
    create: { userId: session.user.id, jobId: job.id },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  await prisma.jobWishlist.deleteMany({
    where: { userId: session.user.id, jobId: job.id },
  });

  return NextResponse.json({ ok: true });
}
