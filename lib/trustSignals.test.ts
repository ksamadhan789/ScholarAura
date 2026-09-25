import { describe, expect, it } from "vitest";
import { formatTrustCount, pickTrustStats, shortReviewerName } from "@/lib/trustSignals";

describe("formatTrustCount", () => {
  it("keeps tiny numbers exact", () => {
    expect(formatTrustCount(7)).toBe("7");
  });

  it("rounds down, never up", () => {
    expect(formatTrustCount(137)).toBe("130+");
    expect(formatTrustCount(999)).toBe("990+");
    expect(formatTrustCount(1284)).toBe("1,200+");
    expect(formatTrustCount(23950)).toBe("23,000+");
  });
});

describe("pickTrustStats", () => {
  const zero = { members: 0, certificates: 0, eventsHosted: 0, eventRegistrations: 0, competitionEntries: 0 };

  it("drops stats below the minimum", () => {
    const stats = pickTrustStats({ ...zero, members: 420, certificates: 75, eventsHosted: 12 });
    expect(stats.map((s) => s.key)).toEqual(["members", "certificates"]);
    expect(stats[0]).toEqual({ key: "members", value: "420+", label: "members" });
  });

  it("shows nothing when only one stat qualifies", () => {
    expect(pickTrustStats({ ...zero, members: 5000 })).toEqual([]);
  });
});

describe("shortReviewerName", () => {
  it("uses first name and last initial", () => {
    expect(shortReviewerName("Priya  Anil Sharma")).toBe("Priya S.");
  });

  it("handles single and empty names", () => {
    expect(shortReviewerName("Rahul")).toBe("Rahul");
    expect(shortReviewerName("  ")).toBe("A learner");
  });
});
