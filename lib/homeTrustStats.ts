import { prisma } from "@/lib/prisma";
import { shortReviewerName, type TrustCounts } from "@/lib/trustSignals";

/**
 * Server-only (Prisma) — kept apart from lib/trustSignals.ts for the same
 * reason lib/homeCategoryStats.ts is split from lib/homeCategories.ts.
 * All-time real counts; lib/trustSignals.ts decides which are big enough to show.
 */
export async function getHomeTrustCounts(): Promise<TrustCounts> {
  const [members, certificates, eventsHosted, eventRegistrations, competitionEntries] = await Promise.all([
    prisma.user.count({ where: { deactivatedAt: null } }),
    prisma.certificate.count({ where: { status: { in: ["GENERATED", "AVAILABLE"] } } }),
    prisma.event.count({ where: { isPublished: true } }),
    prisma.eventRegistration.count({ where: { status: { in: ["CONFIRMED", "ATTENDED"] } } }),
    prisma.competitionEntry.count({ where: { status: "SUCCESS" } }),
  ]);
  return { members, certificates, eventsHosted, eventRegistrations, competitionEntries };
}

export type HomeTestimonial = {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  courseTitle: string;
  courseSlug: string;
};

/** Reviews shorter than this are usually just "good" / "nice course" — not worth featuring. */
const TESTIMONIAL_MIN_LENGTH = 40;
const TESTIMONIAL_COUNT = 3;

/**
 * Real 4–5 star course reviews with a proper comment, best-rated then newest first, at most
 * one per person. The same reviews are already public on each course page.
 */
export async function getHomeTestimonials(): Promise<HomeTestimonial[]> {
  const reviews = await prisma.courseReview.findMany({
    where: {
      rating: { gte: 4 },
      comment: { not: null },
      course: { isPublished: true },
      user: { deactivatedAt: null },
    },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true, slug: true } },
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  const seenUsers = new Set<string>();
  const picked: HomeTestimonial[] = [];
  for (const review of reviews) {
    const comment = review.comment?.trim() ?? "";
    if (comment.length < TESTIMONIAL_MIN_LENGTH || seenUsers.has(review.userId)) continue;
    seenUsers.add(review.userId);
    picked.push({
      id: review.id,
      rating: review.rating,
      comment,
      reviewerName: shortReviewerName(review.user.name),
      courseTitle: review.course.title,
      courseSlug: review.course.slug,
    });
    if (picked.length === TESTIMONIAL_COUNT) break;
  }
  return picked;
}
