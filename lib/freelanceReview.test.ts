import { describe, expect, it } from "vitest";
import { prismaMock } from "../test/prismaMock";
import { canReviewFreelanceListing, getFreelanceRatingSummaries } from "@/lib/freelanceReview";

const listing = { id: "listing-1", postedByUserId: "owner-1" };

describe("canReviewFreelanceListing", () => {
  it("never lets the poster review their own listing", async () => {
    expect(await canReviewFreelanceListing(listing, "owner-1")).toBe(false);
    expect(prismaMock.freelanceMessage.findFirst).not.toHaveBeenCalled();
  });

  it("allows someone the poster has replied to in this listing's thread", async () => {
    prismaMock.freelanceMessage.findFirst.mockResolvedValue({ id: "msg-1" } as never);

    expect(await canReviewFreelanceListing(listing, "client-1")).toBe(true);
    expect(prismaMock.freelanceMessage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          senderId: "owner-1",
          thread: { listingId: "listing-1", initiatorId: "client-1" },
        },
      })
    );
  });

  it("refuses someone who never got a reply", async () => {
    prismaMock.freelanceMessage.findFirst.mockResolvedValue(null);
    expect(await canReviewFreelanceListing(listing, "client-1")).toBe(false);
  });
});

describe("getFreelanceRatingSummaries", () => {
  it("skips the query when there are no listings", async () => {
    expect((await getFreelanceRatingSummaries([])).size).toBe(0);
    expect(prismaMock.freelanceReview.groupBy).not.toHaveBeenCalled();
  });

  it("maps each listing to its average and count", async () => {
    // groupBy's overloaded return type defeats mockResolvedValue's inference —
    // same cast as lib/referralLeaderboard.test.ts.
    (
      prismaMock.freelanceReview.groupBy as unknown as { mockResolvedValue: (value: unknown) => void }
    ).mockResolvedValue([{ listingId: "listing-1", _avg: { rating: 4.5 }, _count: { _all: 2 } }]);

    const summaries = await getFreelanceRatingSummaries(["listing-1", "listing-2"]);
    expect(summaries.get("listing-1")).toEqual({ average: 4.5, count: 2 });
    expect(summaries.has("listing-2")).toBe(false);
  });
});
