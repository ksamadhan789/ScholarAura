import { prisma } from "@/lib/prisma";

export type HomeCategory = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: string;
  /** Optional real photo/illustration — falls back to the icon + gradient panel when unset. */
  image?: string;
  /** Key into the stats map returned by getHomeCategoryStats(). */
  statKey: string;
  statLabel: string;
};

// Every href below is an existing route — conferences/webinars/FDPs/training
// all live on the shared /events page filtered by ?type=, there are no
// separate listing pages for them.
export const HOME_CATEGORIES: HomeCategory[] = [
  {
    id: "courses",
    eyebrow: "Courses",
    title: "Courses",
    description: "Build practical academic and professional skills.",
    cta: "Explore Courses",
    href: "/courses",
    icon: "📚",
    statKey: "courses",
    statLabel: "courses",
  },
  {
    id: "competitions",
    eyebrow: "Competitions",
    title: "Competitions",
    description: "Showcase your knowledge, creativity and skills.",
    cta: "Explore Competitions",
    href: "/competitions",
    icon: "🏆",
    statKey: "competitions",
    statLabel: "active competitions",
  },
  {
    id: "international-conferences",
    eyebrow: "Conferences",
    title: "International Conferences",
    description: "Present and connect at global academic conferences.",
    cta: "Explore International Conferences",
    href: "/events?type=INTERNATIONAL_CONFERENCE",
    icon: "🌍",
    statKey: "internationalConferences",
    statLabel: "upcoming",
  },
  {
    id: "national-conferences",
    eyebrow: "Conferences",
    title: "National Conferences",
    description: "Engage with India's academic and research community.",
    cta: "Explore National Conferences",
    href: "/events?type=NATIONAL_CONFERENCE",
    icon: "🏛️",
    statKey: "nationalConferences",
    statLabel: "upcoming",
  },
  {
    id: "fdp",
    eyebrow: "Faculty Development",
    title: "Faculty Development",
    description: "Develop teaching, research and professional skills.",
    cta: "Explore FDPs",
    href: "/events?type=FDP",
    icon: "🎓",
    statKey: "fdp",
    statLabel: "upcoming",
  },
  {
    id: "jobs",
    eyebrow: "Careers",
    title: "Academic & Professional Jobs",
    description: "Discover your next career opportunity.",
    cta: "Explore Jobs",
    href: "/jobs",
    icon: "💼",
    statKey: "jobs",
    statLabel: "open roles",
  },
  {
    id: "internships",
    eyebrow: "Careers",
    title: "Internships",
    description: "Gain practical experience and industry exposure.",
    cta: "Explore Internships",
    href: "/jobs?employmentType=INTERNSHIP",
    icon: "🧑‍🎓",
    statKey: "internships",
    statLabel: "open",
  },
  {
    id: "webinars",
    eyebrow: "Online",
    title: "Webinars",
    description: "Learn directly from academic and industry experts.",
    cta: "Explore Webinars",
    href: "/events?type=WEBINAR",
    icon: "💻",
    statKey: "webinars",
    statLabel: "upcoming",
  },
  {
    id: "hands-on-training",
    eyebrow: "VR Training",
    title: "Hands-on Training",
    description: "Turn knowledge into practical, hands-on experience.",
    cta: "Explore Training",
    href: "/events?type=HANDS_ON_TRAINING",
    icon: "🧪",
    statKey: "handsOnTraining",
    statLabel: "upcoming",
  },
  {
    id: "freelance",
    eyebrow: "Marketplace",
    title: "Freelance Opportunities",
    description: "Discover projects and professional opportunities.",
    cta: "Explore Freelance",
    href: "/freelance",
    icon: "🧰",
    statKey: "freelance",
    statLabel: "listings",
  },
  {
    id: "meet-alumni",
    eyebrow: "Community",
    title: "Meet Alumni",
    description: "Connect with the ScholarAura academic community.",
    cta: "Meet Alumni",
    href: "/events?type=ALUMNI_MEET",
    icon: "🎉",
    statKey: "meetAlumni",
    statLabel: "upcoming",
  },
];

/** Real counts only — a category with no matching rows is simply omitted by the caller, never faked. */
export async function getHomeCategoryStats(): Promise<Record<string, number>> {
  const now = new Date();

  const [courseCount, competitionCount, freelanceCount, jobGroups, eventGroups] =
    await Promise.all([
      prisma.course.count({ where: { isPublished: true } }),
      prisma.competition.count({
        where: { isPublished: true, isArchived: false, submissionDeadline: { gte: now } },
      }),
      prisma.freelanceListing.count({ where: { isPublished: true } }),
      prisma.job.groupBy({
        by: ["employmentType"],
        where: { isPublished: true },
        _count: { _all: true },
      }),
      prisma.event.groupBy({
        by: ["type"],
        where: { isPublished: true, endDate: { gte: now } },
        _count: { _all: true },
      }),
    ]);

  const jobCountByType = new Map(jobGroups.map((g) => [g.employmentType, g._count._all]));
  const eventCountByType = new Map(eventGroups.map((g) => [g.type, g._count._all]));
  const totalJobs = jobGroups.reduce((sum, g) => sum + g._count._all, 0);

  return {
    courses: courseCount,
    competitions: competitionCount,
    freelance: freelanceCount,
    jobs: totalJobs,
    internships: jobCountByType.get("INTERNSHIP") ?? 0,
    internationalConferences: eventCountByType.get("INTERNATIONAL_CONFERENCE") ?? 0,
    nationalConferences: eventCountByType.get("NATIONAL_CONFERENCE") ?? 0,
    fdp: eventCountByType.get("FDP") ?? 0,
    webinars: eventCountByType.get("WEBINAR") ?? 0,
    handsOnTraining: eventCountByType.get("HANDS_ON_TRAINING") ?? 0,
    meetAlumni: eventCountByType.get("ALUMNI_MEET") ?? 0,
  };
}
