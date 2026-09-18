import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeroSignInCard } from "@/components/HeroSignInCard";
import { HomeBannerCarousel, type BannerItem } from "@/components/HomeBannerCarousel";
import { HomeCategoryCarousel, type HomeCategoryItem } from "@/components/HomeCategoryCarousel";
import { COURSE_CATEGORY_ICONS } from "@/lib/courseCategories";
import { EVENT_TYPE_LABELS } from "@/lib/eventLabels";
import { HOME_CATEGORIES, getHomeCategoryStats } from "@/lib/homeCategories";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const now = new Date();
  const [courses, events, competitions, categoryStats] = await Promise.all([
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
    getHomeCategoryStats(),
  ]);
  const categoryItems: HomeCategoryItem[] = HOME_CATEGORIES.map((c) => ({
    ...c,
    count: categoryStats[c.statKey],
  }));

  const bannerItems: BannerItem[] = [
    ...courses.slice(0, 2).map((c) => ({
      key: `course-${c.id}`,
      href: `/courses/${c.slug}`,
      badge: "Course",
      title: c.title,
      subtitle: c.category,
      priceLabel: Number(c.price) === 0 ? "Free" : `₹${c.price}`,
      thumbnailUrl: c.thumbnailUrl,
      icon: COURSE_CATEGORY_ICONS[c.category] ?? "📘",
    })),
    ...events.slice(0, 2).map((e) => ({
      key: `event-${e.id}`,
      href: `/events/${e.slug}`,
      badge: EVENT_TYPE_LABELS[e.type] ?? "Event",
      title: e.title,
      subtitle: new Date(e.startDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      priceLabel: Number(e.fee) === 0 ? "Free" : `₹${e.fee}`,
      thumbnailUrl: e.thumbnailUrl,
      icon: "🎉",
    })),
    ...competitions.slice(0, 2).map((c) => ({
      key: `competition-${c.id}`,
      href: `/competitions/${c.slug}`,
      badge: "Competition",
      title: c.title,
      subtitle: `Submit by ${new Date(c.submissionDeadline).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })}`,
      priceLabel: Number(c.fee) === 0 ? "Free" : `₹${c.fee}`,
      thumbnailUrl: c.thumbnailUrl,
      icon: "🏆",
    })),
  ];

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

      <HomeCategoryCarousel categories={categoryItems} />

      <HomeBannerCarousel items={bannerItems} />
    </main>
  );
}
