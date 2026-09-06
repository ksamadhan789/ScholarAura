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

export async function POST(
  request: Request,
  { params }: { params: { slug: string; videoId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const video = await prisma.courseVideo.findUnique({
    where: { id: params.videoId },
    include: { course: true, quiz: true },
  });
  if (!video || video.course.slug !== params.slug) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }
  if (!video.quiz) {
    return NextResponse.json({ error: "This lecture has no quiz" }, { status: 404 });
  }

  const isOwner = video.course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const purchase = await prisma.coursePurchase.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: video.courseId } },
  });
  if (purchase?.status !== "SUCCESS" && !isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const questions = video.quiz.questions as unknown as QuizQuestion[];
  const result = gradeQuiz(questions, parsed.data.answers, video.quiz.passingPercent);

  await prisma.quizAttempt.create({
    data: {
      quizId: video.quiz.id,
      userId: session.user.id,
      scorePercent: result.scorePercent,
      passed: result.passed,
      answers: parsed.data.answers,
    },
  });

  if (result.passed) {
    await issueCourseCertificateIfEligible(session.user.id, video.courseId).catch((err) =>
      console.error("Certificate issuance failed after quiz pass:", err)
    );
  }

  return NextResponse.json({ ...result, questions });
}
