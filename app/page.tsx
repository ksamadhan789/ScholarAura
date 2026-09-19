import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

      <HomeCategoryCarousel categories={categoryItems} />

      <HomeBannerCarousel items={bannerItems} />
    </main>
  );
}
