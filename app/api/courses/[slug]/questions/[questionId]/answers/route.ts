import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notify";

const answerSchema = z.object({
  body: z.string().trim().min(2).max(2000),
});

export async function POST(
  request: Request,
  { params }: { params: { slug: string; questionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const question = await prisma.courseQuestion.findUnique({
    where: { id: params.questionId },
    include: { course: { select: { id: true, slug: true, title: true, instructorId: true } } },
  });
  if (!question || question.course.slug !== params.slug) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const isOwner = question.course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  let isEnrolled = false;
  if (!isOwner && !isAdmin) {
    const purchase = await prisma.coursePurchase.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: question.course.id } },
    });
    isEnrolled = purchase?.status === "SUCCESS";
  }
  if (!isOwner && !isAdmin && !isEnrolled) {
    return NextResponse.json(
      { error: "You can only answer on a course you're enrolled in" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const answer = await prisma.courseAnswer.create({
    data: { questionId: question.id, userId: session.user.id, body: parsed.data.body },
    include: { user: { select: { name: true } } },
  });

  if (question.userId !== session.user.id) {
    await createNotification({
      userId: question.userId,
      type: "QA_ANSWER",
      title: `${answer.user.name} answered your question`,
      body: `On ${question.course.title}`,
      url: `/courses/${question.course.slug}`,
    }).catch((err) => console.error("Failed to create Q&A answer notification:", err));
  }

  return NextResponse.json(answer, { status: 201 });
}
