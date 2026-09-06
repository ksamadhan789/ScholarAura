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

async function authorize(slug: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: "You must be logged in" }, { status: 401 }) };
  }

  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) {
    return { error: NextResponse.json({ error: "Course not found" }, { status: 404 }) };
  }

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  }

  return { course };
}

// courseVideoId is null for a course's final quiz — there's no unique
// constraint to upsert against on (courseId, null), so find-then-write.
export async function PUT(request: Request, { params }: { params: { slug: string } }) {
  const auth = await authorize(params.slug);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = upsertQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const existing = await prisma.quiz.findFirst({
    where: { courseId: auth.course.id, courseVideoId: null },
  });

  const quiz = existing
    ? await prisma.quiz.update({
        where: { id: existing.id },
        data: {
          title: parsed.data.title,
          passingPercent: parsed.data.passingPercent,
          questions: parsed.data.questions,
        },
      })
    : await prisma.quiz.create({
        data: {
          courseId: auth.course.id,
          title: parsed.data.title,
          passingPercent: parsed.data.passingPercent,
          questions: parsed.data.questions,
        },
      });

  return NextResponse.json(quiz);
}

export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const auth = await authorize(params.slug);
  if (auth.error) return auth.error;

  await prisma.quiz.deleteMany({ where: { courseId: auth.course.id, courseVideoId: null } });
  return NextResponse.json({ ok: true });
}
