import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: { slug: string; questionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const question = await prisma.courseQuestion.findUnique({
    where: { id: params.questionId },
    include: { course: { select: { slug: true, instructorId: true } } },
  });
  if (!question || question.course.slug !== params.slug) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const isAuthor = question.userId === session.user.id;
  const isOwner = question.course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isAuthor && !isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await prisma.courseQuestion.delete({ where: { id: params.questionId } });

  return NextResponse.json({ ok: true });
}
