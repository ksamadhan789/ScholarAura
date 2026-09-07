import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HomeHero } from "@/components/HomeHero";
import { PlatformCategories } from "@/components/PlatformCategories";
import { HomeExploreTabs } from "@/components/HomeExploreTabs";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const now = new Date();
  const [courses, events, competitions, jobs, ratingGroups] = await Promise.all([
    prisma.course.findMany({
      where: { isPublished: true },
      include: { instructor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.event.findMany({
      where: { isPublished: true, endDate: { gte: now } },
      orderBy: { startDate: "asc" },
    }),
    prisma.competition.findMany({
      where: { isPublished: true, submissionDeadline: { gte: now } },
      orderBy: { startDate: "asc" },
      take: 4,
    }),
    prisma.job.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.courseReview.groupBy({ by: ["courseId"], _avg: { rating: true }, _count: { _all: true } }),
  ]);
  const ratingByCourseId = new Map(
    ratingGroups.map((g) => [g.courseId, { average: g._avg.rating ?? 0, count: g._count._all }])
  );
  const coursesWithRatings = courses.map((c) => ({
    ...c,
    rating: ratingByCourseId.get(c.id) ?? null,
  }));

  return (
    <main className="flex flex-1 flex-col">
      {!session && (
        <div className="border-b border-brand-100 bg-brand-50 px-4 py-2 text-center text-sm text-brand-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          👋 Sign in to ScholarAura using your Google or email account. Don&apos;t have one?{" "}
          <Link href="/register" className="font-medium underline">
            Sign up now
          </Link>
          .
        </div>
      )}

      <HomeHero />
      <PlatformCategories />

      <HomeExploreTabs courses={coursesWithRatings} events={events} competitions={competitions} jobs={jobs} />
    </main>
  );
}
