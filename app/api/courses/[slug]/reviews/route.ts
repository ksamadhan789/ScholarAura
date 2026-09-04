import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const [reviews, aggregate] = await Promise.all([
    prisma.courseReview.findMany({
      where: { courseId: course.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.courseReview.aggregate({
      where: { courseId: course.id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  return NextResponse.json({
    reviews,
    average: aggregate._avg.rating ?? 0,
    count: aggregate._count._all,
  });
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const purchase = await prisma.coursePurchase.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });
  if (purchase?.status !== "SUCCESS") {
    return NextResponse.json(
      { error: "You can only review a course you're enrolled in" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const review = await prisma.courseReview.upsert({
    where: { courseId_userId: { courseId: course.id, userId: session.user.id } },
    create: {
      courseId: course.id,
      userId: session.user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
  });

  return NextResponse.json(review);
}

export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  await prisma.courseReview
    .delete({ where: { courseId_userId: { courseId: course.id, userId: session.user.id } } })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
