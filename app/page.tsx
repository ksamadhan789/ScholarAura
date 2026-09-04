import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeroSignInCard } from "@/components/HeroSignInCard";
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

      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0), linear-gradient(to bottom right, #1d4ed8, #1e40af, #0f172a)",
          backgroundSize: "28px 28px, 100% 100%",
        }}
      >
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="text-center lg:text-left">
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-100">
              🌟 For professionals, academics & students worldwide
            </span>
            <h1 className="mt-5 text-4xl font-bold text-white sm:text-5xl">
              ScholarAura
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg text-brand-100 lg:mx-0">
              Courses, international & national conferences, faculty
              development programs, and hands-on trainings — all in one
              place.
            </p>

            {session && (
              <Link
                href="/dashboard"
                className="mt-8 inline-block rounded bg-white px-6 py-3 font-medium text-brand-700 transition-colors hover:bg-brand-50"
              >
                Go to your dashboard
              </Link>
            )}
          </div>

          <div className="flex justify-center lg:justify-end">
            {session ? (
              <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl dark:bg-slate-800">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  Welcome back{session.user?.name ? `, ${session.user.name}` : ""} 👋
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Pick up right where you left off ✨
                </p>
                <Link
                  href="/dashboard"
                  className="mt-5 inline-block w-full rounded bg-brand-600 py-2.5 font-medium text-white transition-colors hover:bg-brand-700"
                >
                  Go to your dashboard
                </Link>
              </div>
            ) : (
              <HeroSignInCard />
            )}
          </div>
        </div>
      </section>

      <HomeExploreTabs courses={coursesWithRatings} events={events} competitions={competitions} jobs={jobs} />
    </main>
  );
}
