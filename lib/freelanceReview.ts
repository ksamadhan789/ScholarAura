import { prisma } from "@/lib/prisma";

/**
 * Whether `userId` may review the given freelance listing. There's no
 * in-app order for freelance work, so this is the closest real signal that
 * the two actually dealt with each other: the reviewer started a message
 * thread on this listing and the poster replied in it at least once. Rules
 * out the poster reviewing themselves (they can't start a thread on their
 * own listing) and drive-by reviews from people who never got in touch.
 */
export async function canReviewFreelanceListing(
  listing: { id: string; postedByUserId: string },
  userId: string
): Promise<boolean> {
  if (listing.postedByUserId === userId) return false;

  const ownerReply = await prisma.freelanceMessage.findFirst({
    where: {
      senderId: listing.postedByUserId,
      thread: { listingId: listing.id, initiatorId: userId },
    },
    select: { id: true },
  });
  return ownerReply !== null;
}

/**
 * Average rating and review count per listing, for the browse cards. One
 * grouped query rather than an aggregate per card. Listings with no reviews
 * are simply absent from the map.
 */
export async function getFreelanceRatingSummaries(
  listingIds: string[]
): Promise<Map<string, { average: number; count: number }>> {
  if (listingIds.length === 0) return new Map();
  const rows = await prisma.freelanceReview.groupBy({
    by: ["listingId"],
    where: { listingId: { in: listingIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(
    rows.map((r) => [r.listingId, { average: r._avg.rating ?? 0, count: r._count._all }])
  );
}
