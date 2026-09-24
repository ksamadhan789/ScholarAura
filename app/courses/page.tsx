import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CoursesExplorer } from "@/components/CoursesExplorer";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/Badge";
import { ListingHeader } from "@/components/listing/ListingLayout";

export const metadata: Metadata = {
  title: "Browse Courses",
  description:
    "Explore prerecorded courses from ScholarAura's instructors, covering a wide range of subjects for professionals and academics.",
};

// Course listings and counts change as courses are published/enrolled, and
// this page has no dynamic APIs (cookies/searchParams) to opt it out of
// static prerendering on its own — force it so builds don't depend on DB
// access at build time.
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);

  const [courses, courseCount, enrollmentCount, certificateCount, externalCourses, ratingGroups, wishlistEntries] =
    await Promise.all([
      prisma.course.findMany({
        where: { isPublished: true },
        include: { instructor: { select: { name: true, photoFileId: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.coursePurchase.count({ where: { status: "SUCCESS" } }),
      prisma.certificate.count({ where: { courseId: { not: null } } }),
      prisma.externalCourse.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.courseReview.groupBy({ by: ["courseId"], _avg: { rating: true }, _count: { _all: true } }),
      session
        ? prisma.courseWishlist.findMany({
            where: { userId: session.user.id },
            select: { courseId: true },
          })
        : Promise.resolve([]),
    ]);

  const ratingByCourseId = new Map(
    ratingGroups.map((g) => [g.courseId, { average: g._avg.rating ?? 0, count: g._count._all }])
  );
  const coursesWithRatings = courses.map((c) => ({
    ...c,
    rating: ratingByCourseId.get(c.id) ?? null,
  }));
  const wishlistedCourseIds = wishlistEntries.map((w) => w.courseId);

  // Public platform stats — a zero is left out rather than advertised, and the
  // bar only shows once there are at least two real numbers (a lone "N
  // courses" would just repeat the results heading above it).
  const stats = [
    { label: "Courses", value: courseCount },
    { label: "Enrollments", value: enrollmentCount },
    { label: "Certificates issued", value: certificateCount },
  ].filter((s) => s.value > 0);

  return (
    <main>
      <ListingHeader
        title="Courses"
        subtitle="Video courses with quizzes, downloadable resources and a certificate when you finish."
      />

      <CoursesExplorer
        courses={coursesWithRatings}
        isLoggedIn={!!session}
        wishlistedCourseIds={wishlistedCourseIds}
      />

      <div className="mx-auto max-w-[1400px] px-4 pb-16">
        {stats.length >= 2 && (
          <div
            className={`mt-8 grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white py-6 text-center shadow-sm dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800 sm:divide-x sm:divide-y-0 ${
              stats.length === 3 ? "sm:grid-cols-3" : stats.length === 2 ? "sm:grid-cols-2" : ""
            }`}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="py-3 first:pt-0 last:pb-0 sm:py-0">
                <p className="text-3xl font-bold text-brand-700 dark:text-brand-400">
                  {stat.value.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {externalCourses.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-1 text-xl font-semibold text-slate-900 dark:text-white">
              Recommended courses from other providers
            </h2>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              These courses are hosted and taught by their own providers — clicking through takes you
              to their site to enroll. ScholarAura doesn&apos;t host this content or issue these
              certificates.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {externalCourses.map((course) => (
                <a
                  key={course.id}
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-700"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="neutral">{course.provider}</Badge>
                    <ExternalLink aria-label="Opens the provider's site" className="h-4 w-4 text-slate-400" />
                  </div>
                  <h3 className="mt-2 font-semibold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                    {course.title}
                  </h3>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{course.description}</p>
                  <p className="mt-3 text-xs text-slate-400">{course.category}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
