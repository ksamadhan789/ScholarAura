import { prisma } from "@/lib/prisma";

/**
 * Server-only — split out from lib/homeCategories.ts (which HomeCategoryCarousel,
 * a client component, imports for its static category/group data) so that
 * importing that static data never drags Prisma's client into the browser
 * bundle. Keep this file's only export a prisma-backed one.
 */

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
