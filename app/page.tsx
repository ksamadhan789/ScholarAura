import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HomeHero } from "@/components/HomeHero";
import { TrustStrip } from "@/components/TrustStrip";
import { PlatformCategories } from "@/components/PlatformCategories";
import { OpportunityExplorer } from "@/components/OpportunityExplorer";
import { FeaturedCourses } from "@/components/FeaturedCourses";

export const metadata: Metadata = {
  title: {
    absolute: "ScholarAura | Courses, Conferences, FDPs, Training & Academic Opportunities",
  },
  description:
    "ScholarAura is an academic platform for students, faculty, researchers and professionals offering courses, conferences, faculty development programs, hands-on training, competitions and career opportunities.",
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const now = new Date();
  const [courses, events, competitions, jobs, ratingGroups, purchaseGroups, durationGroups] =
    await Promise.all([
      prisma.course.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.event.findMany({
        where: { isPublished: true, endDate: { gte: now } },
        orderBy: { startDate: "asc" },
        take: 12,
      }),
      prisma.competition.findMany({
        where: { isPublished: true, submissionDeadline: { gte: now } },
        orderBy: { submissionDeadline: "asc" },
        take: 6,
      }),
      prisma.job.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.courseReview.groupBy({ by: ["courseId"], _avg: { rating: true }, _count: { _all: true } }),
      prisma.coursePurchase.groupBy({ by: ["courseId"], _count: { _all: true } }),
      prisma.courseVideo.groupBy({ by: ["courseId"], _sum: { durationSeconds: true } }),
    ]);

  const ratingByCourseId = new Map(
    ratingGroups.map((g) => [g.courseId, { average: g._avg.rating ?? 0, count: g._count._all }])
  );
  const learnerCountByCourseId = new Map(purchaseGroups.map((g) => [g.courseId, g._count._all]));
  const durationByCourseId = new Map(
    durationGroups.map((g) => [g.courseId, Math.round((g._sum.durationSeconds ?? 0) / 60)])
  );
  const featuredCourses = courses.slice(0, 4).map((c) => ({
    ...c,
    rating: ratingByCourseId.get(c.id) ?? null,
    learnerCount: learnerCountByCourseId.get(c.id) ?? 0,
    durationMinutes: durationByCourseId.get(c.id) ?? 0,
  }));

  return (
    <main className="flex flex-1 flex-col">
      <HomeHero />
      <TrustStrip />
      <PlatformCategories />

      <OpportunityExplorer courses={courses} events={events} competitions={competitions} jobs={jobs} />

      <FeaturedCourses courses={featuredCourses} />

      {!session && (
        <section className="mx-auto w-full max-w-2xl px-4 pb-16 pt-16 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ready to get started?{" "}
            <Link href="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Create a free account
            </Link>{" "}
            or{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              log in
            </Link>
            .
          </p>
        </section>
      )}
    </main>
  );
}
