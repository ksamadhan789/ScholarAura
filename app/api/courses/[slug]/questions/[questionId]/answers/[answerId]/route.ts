import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: { slug: string; questionId: string; answerId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const answer = await prisma.courseAnswer.findUnique({
    where: { id: params.answerId },
    include: {
      question: { include: { course: { select: { slug: true, instructorId: true } } } },
    },
  });
  if (
    !answer ||
    answer.questionId !== params.questionId ||
    answer.question.course.slug !== params.slug
  ) {
    return NextResponse.json({ error: "Answer not found" }, { status: 404 });
  }

  const isAuthor = answer.userId === session.user.id;
  const isOwner = answer.question.course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isAuthor && !isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await prisma.courseAnswer.delete({ where: { id: params.answerId } });

  return NextResponse.json({ ok: true });
}
