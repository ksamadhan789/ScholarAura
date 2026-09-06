import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuizBuilderForm } from "@/components/QuizBuilderForm";
import type { QuizQuestion } from "@/lib/quiz";

export default async function LectureQuizPage({
  params,
}: {
  params: { slug: string; videoId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const video = await prisma.courseVideo.findUnique({
    where: { id: params.videoId },
    include: { course: true, quiz: true },
  });
  if (!video || video.course.slug !== params.slug) notFound();

  const isOwner = video.course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) redirect("/dashboard/courses");

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <Link
        href={`/dashboard/courses/${video.course.slug}`}
        className="text-sm text-gray-500 hover:underline dark:text-slate-400"
      >
        ← {video.course.title}
      </Link>
      <h1 className="mt-2 mb-1 text-2xl font-semibold">Quiz for &ldquo;{video.title}&rdquo;</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
        Shown to students on this lecture&rsquo;s page. A passing attempt is required, alongside the
        course&rsquo;s other quizzes, before a completion certificate is issued.
      </p>

      <QuizBuilderForm
        endpoint={`/api/courses/${video.course.slug}/videos/${video.id}/quiz`}
        backHref={`/dashboard/courses/${video.course.slug}`}
        hasExistingQuiz={Boolean(video.quiz)}
        initial={{
          title: video.quiz?.title ?? `${video.title} — Quiz`,
          passingPercent: video.quiz?.passingPercent ?? 70,
          questions: (video.quiz?.questions as unknown as QuizQuestion[] | undefined) ?? [],
        }}
      />
    </main>
  );
}
