import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuizBuilderForm } from "@/components/QuizBuilderForm";
import type { QuizQuestion } from "@/lib/quiz";

export default async function CourseFinalQuizPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const course = await prisma.course.findUnique({ where: { slug: params.slug } });
  if (!course) notFound();

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) redirect("/dashboard/courses");

  const quiz = await prisma.quiz.findFirst({ where: { courseId: course.id, courseVideoId: null } });

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <Link
        href={`/dashboard/courses/${course.slug}`}
        className="text-sm text-gray-500 hover:underline dark:text-slate-400"
      >
        ← {course.title}
      </Link>
      <h1 className="mt-2 mb-1 text-2xl font-semibold">Final quiz</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
        Shown once a student has watched every lecture. A passing attempt is required, alongside any
        per-lecture quizzes, before their completion certificate is issued.
      </p>

      <QuizBuilderForm
        endpoint={`/api/courses/${course.slug}/quiz`}
        backHref={`/dashboard/courses/${course.slug}`}
        hasExistingQuiz={Boolean(quiz)}
        initial={{
          title: quiz?.title ?? `${course.title} — Final Quiz`,
          passingPercent: quiz?.passingPercent ?? 70,
          questions: (quiz?.questions as unknown as QuizQuestion[] | undefined) ?? [],
        }}
      />
    </main>
  );
}
