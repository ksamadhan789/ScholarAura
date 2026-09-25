import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowRight, Award, BookOpen, CheckCircle2, Clock, GraduationCap, Receipt } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RequestRefundButton } from "@/components/RequestRefundButton";
import { Thumbnail } from "@/components/Thumbnail";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_PRIMARY_BUTTON_CLASS,
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DashboardEmptyState,
  DashboardShell,
  DashboardTabs,
} from "@/components/dashboard/DashboardShell";
import { formatLength, summarizeCourseProgress } from "@/lib/dashboardSummary";

const TABS = ["all", "in-progress", "completed"] as const;
type Tab = (typeof TABS)[number];

export default async function MyLearningPage({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const userId = session.user.id;
  const tab: Tab = TABS.includes(searchParams.tab as Tab) ? (searchParams.tab as Tab) : "all";

  const purchases = await prisma.coursePurchase.findMany({
    where: { userId, status: "SUCCESS" },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
          thumbnailUrl: true,
          instructor: { select: { name: true } },
          videos: { select: { id: true, durationSeconds: true }, orderBy: { orderIndex: "asc" } },
        },
      },
    },
    orderBy: { purchasedAt: "desc" },
  });

  const purchaseIds = purchases.map((p) => p.id);
  const courseIds = purchases.map((p) => p.course.id);
  const allVideoIds = purchases.flatMap((p) => p.course.videos.map((v) => v.id));
  const [pendingRequests, completedProgress, certificates] = await Promise.all([
    prisma.refundRequest.findMany({
      where: { status: "PENDING", coursePurchaseId: { in: purchaseIds } },
      select: { coursePurchaseId: true },
    }),
    prisma.courseProgress.findMany({
      where: { userId, courseVideoId: { in: allVideoIds }, completedAt: { not: null } },
      select: { courseVideoId: true },
    }),
    prisma.certificate.findMany({
      where: { userId, courseId: { in: courseIds }, status: { in: ["GENERATED", "AVAILABLE"] }, revokedAt: null },
      select: { courseId: true },
    }),
  ]);
  const pendingPurchaseIds = new Set(pendingRequests.map((r) => r.coursePurchaseId));
  const completedVideoIds = new Set(completedProgress.map((p) => p.courseVideoId));
  const certifiedCourseIds = new Set(certificates.map((c) => c.courseId));

  const courses = purchases.map((purchase) => {
    const progress = summarizeCourseProgress(purchase.course.videos, completedVideoIds);
    const remainingSeconds = purchase.course.videos
      .filter((v) => !completedVideoIds.has(v.id))
      .reduce((sum, v) => sum + v.durationSeconds, 0);
    return { purchase, progress, remainingSeconds };
  });
  const completedCount = courses.filter((c) => c.progress.isComplete).length;
  const inProgressCount = courses.length - completedCount;
  const visible = courses.filter(({ progress }) =>
    tab === "completed" ? progress.isComplete : tab === "in-progress" ? !progress.isComplete : true,
  );

  return (
    <DashboardShell
      title="My learning"
      description={
        courses.length > 0
          ? `${courses.length} ${courses.length === 1 ? "course" : "courses"} · ${completedCount} completed`
          : "Courses you enrol in show up here, with your progress."
      }
      actions={
        courses.length > 0 && (
          <Link href="/courses" className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
            <BookOpen aria-hidden className="h-4 w-4" />
            Browse courses
          </Link>
        )
      }
    >
      {courses.length === 0 ? (
        <DashboardEmptyState
          icon={GraduationCap}
          title="You haven't enrolled in a course yet"
          text="Pick a course, learn at your own pace, and earn a certificate anyone can verify."
          href="/courses"
          cta="Browse courses"
        />
      ) : (
        <>
          <DashboardTabs
            active={tab}
            tabs={[
              { key: "all", label: "All", count: courses.length, href: "/dashboard/learning" },
              {
                key: "in-progress",
                label: "In progress",
                count: inProgressCount,
                href: "/dashboard/learning?tab=in-progress",
              },
              {
                key: "completed",
                label: "Completed",
                count: completedCount,
                href: "/dashboard/learning?tab=completed",
              },
            ]}
          />

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
              {tab === "completed"
                ? "No completed courses yet — keep going, you're on your way."
                : "Nothing in progress — every course you're enrolled in is complete."}
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map(({ purchase, progress, remainingSeconds }) => {
                const { course } = purchase;
                const lectureHref = progress.nextVideoId
                  ? `/courses/${course.slug}/lectures/${progress.nextVideoId}`
                  : `/courses/${course.slug}`;
                return (
                  <li key={course.id} className={`${DASHBOARD_CARD_CLASS} flex flex-col overflow-hidden`}>
                    <Link href={lectureHref} className="relative block" tabIndex={-1} aria-hidden>
                      <Thumbnail
                        url={course.thumbnailUrl}
                        alt=""
                        icon={<GraduationCap className="h-10 w-10" strokeWidth={1.5} />}
                      />
                      {progress.isComplete && (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Completed
                        </span>
                      )}
                    </Link>

                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                        {course.category}
                      </p>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="mt-1 line-clamp-2 font-semibold leading-snug text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                      >
                        {course.title}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">by {course.instructor.name}</p>

                      {progress.total > 0 ? (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span className="tabular-nums">
                              {progress.completed} of {progress.total} lectures
                            </span>
                            <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                              {progress.percent}%
                            </span>
                          </div>
                          <div
                            className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
                            role="progressbar"
                            aria-valuenow={progress.percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${course.title} progress`}
                          >
                            <div
                              className={`h-full rounded-full ${progress.isComplete ? "bg-emerald-500" : "bg-brand-600"}`}
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                          {!progress.isComplete && remainingSeconds > 0 && (
                            <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <Clock aria-hidden className="h-3.5 w-3.5" />
                              {formatLength(remainingSeconds)} left
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                          Lectures are being added — check back soon.
                        </p>
                      )}

                      <div className="mt-auto pt-5">
                        {progress.nextVideoId && (
                          <Link href={lectureHref} className={`${DASHBOARD_PRIMARY_BUTTON_CLASS} w-full`}>
                            {progress.actionLabel === "Review" ? "Review course" : progress.actionLabel}
                            <ArrowRight aria-hidden className="h-4 w-4" />
                          </Link>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {certifiedCourseIds.has(course.id) && (
                            <Link href="/dashboard/certificates" className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
                              <Award aria-hidden className="h-4 w-4 text-amber-500" />
                              Certificate
                            </Link>
                          )}
                          <a
                            href={`/api/receipts/course/${purchase.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={DASHBOARD_SECONDARY_BUTTON_CLASS}
                          >
                            <Receipt aria-hidden className="h-4 w-4" />
                            Receipt
                          </a>
                          {Number(purchase.amount) > 0 && (
                            <RequestRefundButton
                              kind="course"
                              itemId={purchase.id}
                              isPending={pendingPurchaseIds.has(purchase.id)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </DashboardShell>
  );
}
