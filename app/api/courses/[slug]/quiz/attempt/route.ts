import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeQuiz, type QuizQuestion } from "@/lib/quiz";
import { issueCourseCertificateIfEligible } from "@/lib/certificate";

const submitSchema = z.object({
  answers: z.record(z.array(z.string())),
});

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({ where: { slug: params.slug } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const quiz = await prisma.quiz.findFirst({ where: { courseId: course.id, courseVideoId: null } });
  if (!quiz) {
    return NextResponse.json({ error: "This course has no final quiz" }, { status: 404 });
  }

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const purchase = await prisma.coursePurchase.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });
  if (purchase?.status !== "SUCCESS" && !isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const questions = quiz.questions as unknown as QuizQuestion[];
  const result = gradeQuiz(questions, parsed.data.answers, quiz.passingPercent);

  await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId: session.user.id,
      scorePercent: result.scorePercent,
      passed: result.passed,
      answers: parsed.data.answers,
    },
  });

  if (result.passed) {
    await issueCourseCertificateIfEligible(session.user.id, course.id).catch((err) =>
      console.error("Certificate issuance failed after quiz pass:", err)
    );
  }

  return NextResponse.json({ ...result, questions });
}
