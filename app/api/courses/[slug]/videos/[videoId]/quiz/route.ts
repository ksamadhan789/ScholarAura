import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quizQuestionsSchema } from "@/lib/quiz";

const upsertQuizSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  passingPercent: z.coerce.number().int().min(1).max(100),
  questions: quizQuestionsSchema,
});

async function authorize(slug: string, videoId: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: "You must be logged in" }, { status: 401 }) };
  }

  const video = await prisma.courseVideo.findUnique({
    where: { id: videoId },
    include: { course: { select: { slug: true, instructorId: true } } },
  });
  if (!video || video.course.slug !== slug) {
    return { error: NextResponse.json({ error: "Lecture not found" }, { status: 404 }) };
  }

  const isOwner = video.course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  }

  return { video };
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string; videoId: string } }
) {
  const auth = await authorize(params.slug, params.videoId);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = upsertQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const quiz = await prisma.quiz.upsert({
    where: { courseVideoId: params.videoId },
    update: {
      title: parsed.data.title,
      passingPercent: parsed.data.passingPercent,
      questions: parsed.data.questions,
    },
    create: {
      courseId: auth.video.courseId,
      courseVideoId: params.videoId,
      title: parsed.data.title,
      passingPercent: parsed.data.passingPercent,
      questions: parsed.data.questions,
    },
  });

  return NextResponse.json(quiz);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { slug: string; videoId: string } }
) {
  const auth = await authorize(params.slug, params.videoId);
  if (auth.error) return auth.error;

  await prisma.quiz.deleteMany({ where: { courseVideoId: params.videoId } });
  return NextResponse.json({ ok: true });
}
