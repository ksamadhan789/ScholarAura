import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Clock,
  ExternalLink,
  ListVideo,
  PlayCircle,
  Plus,
  Radio,
  Star,
  Users,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { Thumbnail } from "@/components/Thumbnail";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_PRIMARY_BUTTON_CLASS,
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DashboardEmptyState,
  DashboardShell,
  DashboardStatCard,
} from "@/components/dashboard/DashboardShell";
import { formatLength } from "@/lib/dashboardSummary";
import { PublishToggle } from "./PublishToggle";

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  const isAdmin = session.user.role === "ADMIN";

  const courses = await prisma.course.findMany({
    where: isAdmin ? {} : { instructorId: session.user.id },
    include: { videos: { select: { durationSeconds: true } } },
    orderBy: { createdAt: "desc" },
  });
  const courseIds = courses.map((c) => c.id);
  const [enrolments, ratings] = courseIds.length
    ? await Promise.all([
        prisma.coursePurchase.groupBy({
          by: ["courseId"],
          where: { courseId: { in: courseIds }, status: "SUCCESS" },
          _count: { _all: true },
        }),
        prisma.courseReview.groupBy({
          by: ["courseId"],
          where: { courseId: { in: courseIds } },
          _avg: { rating: true },
          _count: { _all: true },
        }),
      ])
    : [[], []];
  const studentsByCourse = new Map(enrolments.map((e) => [e.courseId, e._count._all]));
  const ratingByCourse = new Map(ratings.map((r) => [r.courseId, { avg: r._avg.rating ?? 0, count: r._count._all }]));

  const publishedCount = courses.filter((c) => c.isPublished).length;
  const totalStudents = enrolments.reduce((sum, e) => sum + e._count._all, 0);
  const totalLectures = courses.reduce((sum, c) => sum + c.videos.length, 0);
  const reviewCount = ratings.reduce((sum, r) => sum + r._count._all, 0);
  const overallRating =
    reviewCount > 0 ? ratings.reduce((sum, r) => sum + (r._avg.rating ?? 0) * r._count._all, 0) / reviewCount : null;

  return (
    <DashboardShell
      title={isAdmin ? "All courses" : "My courses"}
      description={
        courses.length > 0
          ? `${courses.length} ${courses.length === 1 ? "course" : "courses"} · ${publishedCount} published`
          : "Create a course, add lectures, and publish it when it's ready."
      }
      actions={
        <>
          <Link href="/dashboard/courses/analytics" className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
            <BarChart3 aria-hidden className="h-4 w-4" />
            Analytics
          </Link>
          <Link href="/dashboard/courses/new" className={`${DASHBOARD_PRIMARY_BUTTON_CLASS} py-1.5`}>
            <Plus aria-hidden className="h-4 w-4" />
            New course
          </Link>
        </>
      }
    >
      {courses.length === 0 ? (
        <DashboardEmptyState
          icon={BookOpen}
          title="You haven't created a course yet"
          text="Start with a title and price, then upload lectures. Nothing is visible to students until you publish."
          href="/dashboard/courses/new"
          cta="Create a course"
        />
      ) : (
        <>
          <section aria-label="Teaching activity" className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <DashboardStatCard icon={Radio} value={publishedCount} label="Published courses" />
            <DashboardStatCard
              href="/dashboard/courses/analytics"
              icon={Users}
              value={totalStudents}
              label="Students enrolled"
            />
            <DashboardStatCard icon={ListVideo} value={totalLectures} label="Lectures uploaded" />
            <DashboardStatCard
              icon={Star}
              value={overallRating !== null ? overallRating.toFixed(1) : "—"}
              label={reviewCount > 0 ? `Average rating · ${reviewCount} reviews` : "No reviews yet"}
            />
          </section>

          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const students = studentsByCourse.get(course.id) ?? 0;
              const rating = ratingByCourse.get(course.id);
              const totalSeconds = course.videos.reduce((sum, v) => sum + v.durationSeconds, 0);
              const price = Number(course.price);
              return (
                <li key={course.id} className={`${DASHBOARD_CARD_CLASS} flex flex-col overflow-hidden`}>
                  <div className="relative">
                    <Thumbnail
                      url={course.thumbnailUrl}
                      alt=""
                      icon={<PlayCircle className="h-10 w-10" strokeWidth={1.5} />}
                    />
                    <span className="absolute left-3 top-3">
                      <Badge variant={course.isPublished ? "success" : "warning"}>
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                      {course.category}
                    </p>
                    <p className="mt-1 line-clamp-2 font-semibold leading-snug text-slate-900 dark:text-white">
                      {course.title}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {price === 0 ? "Free" : `₹${price.toLocaleString("en-IN")}`}
                    </p>
                    <ul className="mt-3 space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                      <li className="flex items-center gap-2">
                        <ListVideo aria-hidden className="h-4 w-4 shrink-0" />
                        {course.videos.length === 0
                          ? "No lectures yet"
                          : `${course.videos.length} ${course.videos.length === 1 ? "lecture" : "lectures"}`}
                        {totalSeconds > 0 && (
                          <span className="inline-flex items-center gap-1">
                            · <Clock aria-hidden className="h-3.5 w-3.5" />
                            {formatLength(totalSeconds)}
                          </span>
                        )}
                      </li>
                      <li className="flex items-center gap-2">
                        <Users aria-hidden className="h-4 w-4 shrink-0" />
                        {students} {students === 1 ? "student" : "students"}
                      </li>
                      <li className="flex items-center gap-2">
                        <Star aria-hidden className="h-4 w-4 shrink-0" />
                        {rating
                          ? `${rating.avg.toFixed(1)} from ${rating.count} ${rating.count === 1 ? "review" : "reviews"}`
                          : "No reviews yet"}
                      </li>
                    </ul>

                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                      <Link
                        href={`/dashboard/courses/${course.slug}`}
                        className={`${DASHBOARD_PRIMARY_BUTTON_CLASS} py-1.5`}
                      >
                        Manage lectures
                      </Link>
                      <Link
                        href={`/courses/${course.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={DASHBOARD_SECONDARY_BUTTON_CLASS}
                        aria-label={`View ${course.title}`}
                      >
                        <ExternalLink aria-hidden className="h-4 w-4" />
                        View
                      </Link>
                      <span className="ml-auto">
                        <PublishToggle slug={course.slug} isPublished={course.isPublished} />
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </DashboardShell>
  );
}
