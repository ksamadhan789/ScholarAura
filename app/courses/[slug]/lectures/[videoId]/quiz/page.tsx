import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripAnswerKey, type QuizQuestion } from "@/lib/quiz";
import { QuizTaker } from "@/components/QuizTaker";

export default async function LectureQuizTakePage({
  params,
}: {
  params: { slug: string; videoId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/login?callbackUrl=/courses/${params.slug}/lectures/${params.videoId}/quiz`);

  const video = await prisma.courseVideo.findUnique({
    where: { id: params.videoId },
    include: { course: true, quiz: true },
  });
  if (!video || video.course.slug !== params.slug || !video.quiz) notFound();

  const isOwner = video.course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const purchase = await prisma.coursePurchase.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: video.courseId } },
  });
  if (purchase?.status !== "SUCCESS" && !isOwner && !isAdmin) {
    redirect(`/courses/${video.course.slug}`);
  }

  const questions = stripAnswerKey(video.quiz.questions as unknown as QuizQuestion[]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Link
        href={`/courses/${video.course.slug}/lectures/${video.id}`}
        className="text-sm text-gray-500 hover:underline dark:text-slate-400"
      >
        ← {video.title}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{video.quiz.title}</h1>

      <QuizTaker
        endpoint={`/api/courses/${video.course.slug}/videos/${video.id}/quiz/attempt`}
        passingPercent={video.quiz.passingPercent}
        questions={questions}
      />
    </main>
  );
}
