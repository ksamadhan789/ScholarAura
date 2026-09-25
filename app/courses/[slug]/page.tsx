import Link from "next/link";
import { ShareButtons } from "@/components/ShareButtons";
import { SITE_URL } from "@/lib/siteUrl";
import { Award, CheckCircle2, ClipboardCheck, FileDown, Lock, PlayCircle } from "lucide-react";
import { CheckoutAssurance } from "@/components/detail/CheckoutAssurance";
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
      instructor: { select: { id: true, name: true, photoFileId: true, jobRole: true, organization: true, bio: true, publicProfileEnabled: true } },
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
                {course.isPublished && (
                  <ShareButtons url={`${SITE_URL}/courses/${course.slug}`} title={course.title} />
                )}
              </>
            }
          >
            {!session ? (
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/courses/${course.slug}`)}`}
                className={ACTION_PRIMARY_CLASS}
              >
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
            {Number(course.price) > 0 && !isEnrolled && (
              <CheckoutAssurance refundNote="Full refund within 7 days of purchase." />
            )}
          </ActionCard>
        }
      >
        <p className="mt-2 whitespace-pre-line text-lg leading-relaxed text-slate-700 dark:text-slate-300">
          {course.description}
        </p>

        <section className="mt-10">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Course content</h2>
            {course.videos.length > 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {course.videos.length} lecture{course.videos.length === 1 ? "" : "s"}
                {totalMinutes > 0 &&
                  ` · ${totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes} min`} total`}
              </p>
            )}
          </div>
          {course.videos.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No lectures added yet.</p>
          ) : (
            <ol className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
              {course.videos.map((video, i) => {
                const unlocked = hasFullAccess || video.isPreview;
                const completed = completedVideoIds.has(video.id);
                const Icon = completed ? CheckCircle2 : unlocked ? PlayCircle : Lock;
                const row = (
                  <>
                    <Icon
                      aria-hidden
                      className={`h-5 w-5 shrink-0 ${
                        completed
                          ? "text-emerald-600 dark:text-emerald-400"
                          : unlocked
                            ? "text-brand-600 dark:text-brand-400"
                            : "text-slate-400 dark:text-slate-500"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`block ${unlocked ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                        <span className="text-slate-400 dark:text-slate-500">{i + 1}.</span> {video.title}
                      </span>
                      {completed && <span className="text-xs text-emerald-700 dark:text-emerald-400">Completed</span>}
                    </span>
                    {video.isPreview && !hasFullAccess && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                        Preview
                      </span>
                    )}
                    <span className="shrink-0 text-sm tabular-nums text-slate-500 dark:text-slate-400">
                      {Math.round(video.durationSeconds / 60)} min
                    </span>
                  </>
                );

                return (
                  <li key={video.id}>
                    {unlocked ? (
                      <Link
                        href={`/courses/${course.slug}/lectures/${video.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        {row}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3">{row}</div>
                    )}
                  </li>
                );
              })}
              {finalQuiz && hasFullAccess && (
                <li>
                  <Link
                    href={`/courses/${course.slug}/quiz`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <ClipboardCheck
                      aria-hidden
                      className={`h-5 w-5 shrink-0 ${finalQuiz.passed ? "text-emerald-600 dark:text-emerald-400" : "text-brand-600 dark:text-brand-400"}`}
                    />
                    <span className="flex-1 font-medium text-slate-900 dark:text-white">Final quiz</span>
                    {finalQuiz.passed && (
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Passed</span>
                    )}
                  </Link>
                </li>
              )}
            </ol>
          )}
        </section>

        {courseResources.length > 0 && hasFullAccess && (
          <div className="mt-10">
            <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">Resources</h2>
            <div className="flex flex-col gap-2">
              {courseResources.map((r) => (
                <a
                  key={r.id}
                  href={`/api/courses/${course.slug}/resources/${r.id}/download`}
                  className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-3 hover:border-gray-400"
                >
                  <span className="flex items-center gap-2">
                    <FileDown aria-hidden className="h-4 w-4 text-slate-500" />
                    {r.title}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">Your instructor</h2>
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <Avatar
              name={course.instructor.name}
              src={course.instructor.photoFileId ? `/api/courses/${course.slug}/photo` : null}
              size={56}
            />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white">{course.instructor.name}</p>
              {/* Role, organisation and bio come from their profile — only shown if they made it public. */}
              {course.instructor.publicProfileEnabled && (course.instructor.jobRole || course.instructor.organization) && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {[course.instructor.jobRole, course.instructor.organization].filter(Boolean).join(" · ")}
                </p>
              )}
              {course.instructor.publicProfileEnabled && course.instructor.bio && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {course.instructor.bio}
                </p>
              )}
              {course.instructor.publicProfileEnabled && (
                <Link
                  href={`/portfolio/${course.instructor.id}`}
                  className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  View profile
                </Link>
              )}
            </div>
          </div>
        </section>

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
