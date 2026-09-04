import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const questionSchema = z.object({
  body: z.string().trim().min(5).max(2000),
});

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const questions = await prisma.courseQuestion.findMany({
    where: { courseId: course.id },
    include: {
      user: { select: { name: true } },
      answers: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ questions });
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
      { error: "You can only ask a question on a course you're enrolled in" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const question = await prisma.courseQuestion.create({
    data: { courseId: course.id, userId: session.user.id, body: parsed.data.body },
    include: { user: { select: { name: true } }, answers: true },
  });

  return NextResponse.json(question, { status: 201 });
}
