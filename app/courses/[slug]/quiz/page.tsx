import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripAnswerKey, type QuizQuestion } from "@/lib/quiz";
import { QuizTaker } from "@/components/QuizTaker";

export default async function CourseFinalQuizTakePage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/login?callbackUrl=/courses/${params.slug}/quiz`);

  const course = await prisma.course.findUnique({ where: { slug: params.slug } });
  if (!course) notFound();

  const quiz = await prisma.quiz.findFirst({ where: { courseId: course.id, courseVideoId: null } });
  if (!quiz) notFound();

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const purchase = await prisma.coursePurchase.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });
  if (purchase?.status !== "SUCCESS" && !isOwner && !isAdmin) {
    redirect(`/courses/${course.slug}`);
  }

  const questions = stripAnswerKey(quiz.questions as unknown as QuizQuestion[]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Link
        href={`/courses/${course.slug}`}
        className="text-sm text-gray-500 hover:underline dark:text-slate-400"
      >
        ← {course.title}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{quiz.title}</h1>

      <QuizTaker
        endpoint={`/api/courses/${course.slug}/quiz/attempt`}
        passingPercent={quiz.passingPercent}
        questions={questions}
      />
    </main>
  );
}
