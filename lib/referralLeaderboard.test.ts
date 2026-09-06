import { describe, expect, it } from "vitest";
import { prismaMock } from "../test/prismaMock";
import {
  formatReferrerDisplayName,
  getTopReferrersByCount,
  getTopReferrersByCredit,
} from "@/lib/referralLeaderboard";

describe("formatReferrerDisplayName", () => {
  it("keeps a single-word name as-is", () => {
    expect(formatReferrerDisplayName("Priya")).toBe("Priya");
  });

  it("reduces a two-word name to first name + last initial", () => {
    expect(formatReferrerDisplayName("Priya Sharma")).toBe("Priya S.");
  });

  it("uses the last word's initial for a multi-word name", () => {
    expect(formatReferrerDisplayName("Priya Kumar Sharma")).toBe("Priya S.");
  });

  it("falls back to a generic label for an empty name", () => {
    expect(formatReferrerDisplayName("   ")).toBe("Student");
  });
});

describe("getTopReferrersByCount", () => {
  it("ranks users by their referral relation count", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: "u1", name: "Priya Sharma", _count: { referrals: 5 } },
      { id: "u2", name: "Rahul", _count: { referrals: 3 } },
    ] as never);

    const result = await getTopReferrersByCount(10);

    expect(result).toEqual([
      { userId: "u1", displayName: "Priya S.", value: 5, rank: 1 },
      { userId: "u2", displayName: "Rahul", value: 3, rank: 2 },
    ]);
  });
});

// groupBy's overloaded, argument-conditional return type defeats
// mockResolvedValueOnce's inference — cast to the same simple jest-mock
// shape test/prismaMock.ts already uses for $transaction.
const groupByMock = () =>
  prismaMock.creditTransaction.groupBy as unknown as {
    mockResolvedValueOnce: (value: unknown) => { mockResolvedValueOnce: (value: unknown) => unknown };
  };

describe("getTopReferrersByCredit", () => {
  it("nets out refund clawbacks from referral rewards earned", async () => {
    groupByMock()
      .mockResolvedValueOnce([
        { userId: "u1", _sum: { amount: 500 } },
        { userId: "u2", _sum: { amount: 200 } },
      ])
      .mockResolvedValueOnce([{ userId: "u1", _sum: { amount: 100 } }]);
    prismaMock.user.findMany.mockResolvedValue([
      { id: "u1", name: "Priya Sharma" },
      { id: "u2", name: "Rahul Verma" },
    ] as never);

    const result = await getTopReferrersByCredit(10);

    // u1: 500 earned - 100 clawed back = 400, still ranks above u2's 200.
    expect(result).toEqual([
      { userId: "u1", displayName: "Priya S.", value: 400, rank: 1 },
      { userId: "u2", displayName: "Rahul V.", value: 200, rank: 2 },
    ]);
  });

  it("excludes a user whose clawbacks fully offset their earned reward", async () => {
    groupByMock()
      .mockResolvedValueOnce([{ userId: "u1", _sum: { amount: 100 } }])
      .mockResolvedValueOnce([{ userId: "u1", _sum: { amount: 100 } }]);

    const result = await getTopReferrersByCredit(10);

    expect(result).toEqual([]);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });
});
