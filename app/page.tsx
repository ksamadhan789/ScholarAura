import { prisma } from "@/lib/prisma";
import { HomeBannerCarousel, type BannerItem } from "@/components/HomeBannerCarousel";
import { HomeCategoryCarousel, type HomeCategoryItem } from "@/components/HomeCategoryCarousel";
import { COURSE_CATEGORY_ICONS } from "@/lib/courseCategories";
import { EVENT_TYPE_LABELS } from "@/lib/eventLabels";
import { HOME_CATEGORIES } from "@/lib/homeCategories";
import { getHomeCategoryStats } from "@/lib/homeCategoryStats";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeHowItWorks } from "@/components/home/HomeHowItWorks";
import { HomePartnerBand } from "@/components/home/HomePartnerBand";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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

  const heroStats = {
    courses: categoryStats.courses,
    events: events.length,
    competitions: categoryStats.competitions,
    jobs: categoryStats.jobs,
  };

  return (
    <main className="flex flex-1 flex-col">
      <HomeHero stats={heroStats} />

      <HomeCategoryCarousel categories={categoryItems} />

      <HomeBannerCarousel items={bannerItems} />

      <HomeHowItWorks />

      <HomePartnerBand />
    </main>
  );
}
