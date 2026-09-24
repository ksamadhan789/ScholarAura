import Link from "next/link";
import { Award, ClipboardCheck, PlayCircle } from "lucide-react";
import { ActionCard, ActionStatus, ACTION_PRIMARY_CLASS, DetailColumns } from "@/components/detail/DetailLayout";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EnrollButton } from "./EnrollButton";
import { ReviewSection } from "@/components/ReviewSection";
import { CourseQASection } from "./CourseQASection";
import { StarRating } from "@/components/StarRating";
import { WishlistButton } from "@/components/courses/WishlistButton";
import { DetailHero } from "@/components/DetailHero";
import { Avatar } from "@/components/Avatar";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug, isPublished: true },
    select: { title: true, description: true, category: true },
  });

  if (!course) return {};

  return {
    title: course.title,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      type: "website",
    },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);

  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    include: {
      instructor: { select: { id: true, name: true, photoFileId: true } },
      videos: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!course || (!course.isPublished && session?.user.role !== "ADMIN" && session?.user.id !== course.instructorId)) {
    notFound();
  }

  const [purchase, currentUser, rates, wishlistEntry] = session
    ? await Promise.all([
        prisma.coursePurchase.findUnique({
          where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
        }),
        prisma.user.findUnique({ where: { id: session.user.id } }),
        prisma.exchangeRate.findMany({ orderBy: { currencyCode: "asc" } }),
        prisma.courseWishlist.findUnique({
          where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
        }),
      ])
    : [null, null, await prisma.exchangeRate.findMany({ orderBy: { currencyCode: "asc" } }), null];

  const [reviews, reviewAggregate] = await Promise.all([
    prisma.courseReview.findMany({
      where: { courseId: course.id },
      include: { user: { select: { name: true, photoFileId: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.courseReview.aggregate({
      where: { courseId: course.id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);
  const reviewCount = reviewAggregate._count._all;
  const reviewAverage = reviewAggregate._avg.rating ?? 0;

  const questions = await prisma.courseQuestion.findMany({
    where: { courseId: course.id },
    include: {
      user: { select: { name: true } },
      answers: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedRates = rates.map((r) => ({
    currencyCode: r.currencyCode,
    symbol: r.symbol,
    rateFromInr: r.rateFromInr.toString(),
  }));

  const isOwner = session?.user.id === course.instructorId;
  const isAdmin = session?.user.role === "ADMIN";
  const isEnrolled = purchase?.status === "SUCCESS";
  const hasFullAccess = isEnrolled || isOwner || isAdmin;

  const completedVideoIds = session
    ? new Set(
        (
          await prisma.courseProgress.findMany({
            where: {
              userId: session.user.id,
              courseVideoId: { in: course.videos.map((v) => v.id) },
              completedAt: { not: null },
            },
            select: { courseVideoId: true },
          })
        ).map((p) => p.courseVideoId)
      )
    : new Set<string>();

  const courseResources = await prisma.courseResource.findMany({
    where: { courseId: course.id, courseVideoId: null },
    orderBy: { createdAt: "asc" },
  });

  const finalQuizRow = await prisma.quiz.findFirst({
    where: { courseId: course.id, courseVideoId: null },
    select: { id: true },
  });
  const finalQuiz = finalQuizRow
    ? {
        id: finalQuizRow.id,
        passed: session
          ? Boolean(
              await prisma.quizAttempt.findFirst({
                where: { quizId: finalQuizRow.id, userId: session.user.id, passed: true },
              })
            )
          : false,
      }
    : null;

  const totalMinutes = Math.round(course.videos.reduce((sum, v) => sum + v.durationSeconds, 0) / 60);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 sm:py-16">
      {!course.isPublished && (
        <p className="mb-4 inline-block rounded bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-sm text-amber-800 dark:text-amber-300">
          Draft — not visible to the public yet
        </p>
      )}

      <DetailHero
        image={course.thumbnailUrl}
        eyebrow={course.category}
        title={course.title}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <Avatar
                name={course.instructor.name}
                src={course.instructor.photoFileId ? `/api/courses/${course.slug}/photo` : null}
                size={20}
              />
              By {course.instructor.name}
            </span>
            {reviewCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <StarRating value={reviewAverage} />
                {reviewAverage.toFixed(1)} ({reviewCount} review{reviewCount === 1 ? "" : "s"})
              </span>
            )}
          </>
        }
      />

      <DetailColumns
        aside={
          <ActionCard
            label="Course price"
            price={Number(course.price) === 0 ? "Free" : `₹${course.price}`}
            footer={
              <>
                <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <PlayCircle aria-hidden className="h-4 w-4" />
                  {course.videos.length} lecture{course.videos.length === 1 ? "" : "s"}
                  {totalMinutes > 0 && ` · ${totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes} min`}`}
                </p>
                {finalQuiz && (
                  <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <ClipboardCheck aria-hidden className="h-4 w-4" />
                    Final quiz
                  </p>
                )}
                <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Award aria-hidden className="h-4 w-4" />
                  Certificate on completion
                </p>
                {session && !isEnrolled && <WishlistButton slug={course.slug} isWishlisted={!!wishlistEntry} />}
              </>
            }
          >
            {!session ? (
              <Link href="/login" className={ACTION_PRIMARY_CLASS}>
                Log in to enroll
              </Link>
            ) : isEnrolled ? (
              <>
                <ActionStatus tone="success">You&apos;re enrolled in this course</ActionStatus>
                {course.videos[0] && (
                  <Link href={`/courses/${course.slug}/lectures/${course.videos[0].id}`} className={ACTION_PRIMARY_CLASS}>
                    Go to course
                  </Link>
                )}
              </>
            ) : (
              <>
                {Number(course.price) > 0 && currentUser && Number(currentUser.creditBalance) > 0 && (
                  <p className="text-sm text-green-700 dark:text-green-400">
                    You have ₹{Number(currentUser.creditBalance).toFixed(2)} credit — applied
                    automatically when paying in INR.
                  </p>
                )}
                <EnrollButton
                  slug={course.slug}
                  isPaid={Number(course.price) > 0}
                  price={Number(course.price)}
                  rates={serializedRates}
                  userName={session.user.name}
                  userEmail={session.user.email}
                />
              </>
            )}
          </ActionCard>
        }
      >
        <p className="mt-4 text-gray-700 dark:text-slate-300">{course.description}</p>

        <div className="mt-10">
          <h2 className="mb-3 text-lg font-medium">Curriculum</h2>
          {course.videos.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400">No lectures added yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {course.videos.map((video, i) => {
                const unlocked = hasFullAccess || video.isPreview;
                const completed = completedVideoIds.has(video.id);
                const label = (
                  <div>
                    <p>
                      {i + 1}. {video.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {Math.round(video.durationSeconds / 60)} min
                      {video.isPreview && !hasFullAccess ? " · Free preview" : ""}
                      {completed ? " · ✓ Completed" : ""}
                    </p>
                  </div>
                );

                return unlocked ? (
                  <Link
                    key={video.id}
                    href={`/courses/${course.slug}/lectures/${video.id}`}
                    className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-3 hover:border-gray-400"
                  >
                    {label}
                  </Link>
                ) : (
                  <div
                    key={video.id}
                    className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-3 text-gray-400"
                  >
                    {label}
                    <span aria-hidden>🔒</span>
                  </div>
                );
              })}
              {finalQuiz && hasFullAccess && (
                <Link
                  href={`/courses/${course.slug}/quiz`}
                  className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-3 hover:border-gray-400"
                >
                  <p>📝 Final quiz{finalQuiz.passed ? " · ✓ Passed" : ""}</p>
                </Link>
              )}
            </div>
          )}
        </div>

        {courseResources.length > 0 && hasFullAccess && (
          <div className="mt-10">
            <h2 className="mb-3 text-lg font-medium">Resources</h2>
            <div className="flex flex-col gap-2">
              {courseResources.map((r) => (
                <a
                  key={r.id}
                  href={`/api/courses/${course.slug}/resources/${r.id}/download`}
                  className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-3 hover:border-gray-400"
                >
                  📎 {r.title}
                </a>
              ))}
            </div>
          </div>
        )}

        <CourseQASection
          slug={course.slug}
          questions={questions.map((q) => ({
            ...q,
            createdAt: q.createdAt.toISOString(),
            answers: q.answers.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
          }))}
          instructorId={course.instructorId}
          isEnrolled={isEnrolled}
          currentUserId={session?.user.id ?? null}
          isAdmin={isAdmin}
          isOwner={isOwner}
        />

        <ReviewSection
          apiBase={`/api/courses/${course.slug}/reviews`}
          adminDeleteBase="/api/admin/course-reviews"
          reviews={reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
          average={reviewAverage}
          count={reviewCount}
          canReview={isEnrolled}
          placeholder="What did you think of this course? (optional)"
          currentUserId={session?.user.id ?? null}
          isAdmin={isAdmin}
        />
      </DetailColumns>
    </main>
  );
}
