import { prisma } from "@/lib/prisma";

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  value: number;
  rank: number;
};

/**
 * "Priya Kumar Sharma" -> "Priya S." — identifiable without exposing a
 * referrer's full name to every other student who sees the leaderboard.
 */
export function formatReferrerDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Student";
  if (parts.length === 1) return parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase();
  return lastInitial ? `${parts[0]} ${lastInitial}.` : parts[0];
}

export async function getTopReferrersByCount(limit = 10): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    where: { referrals: { some: {} } },
    select: { id: true, name: true, _count: { select: { referrals: true } } },
    orderBy: { referrals: { _count: "desc" } },
    take: limit,
  });

  return users.map((u, i) => ({
    userId: u.id,
    displayName: formatReferrerDisplayName(u.name),
    value: u._count.referrals,
    rank: i + 1,
  }));
}

/**
 * Ranks by net referral credit earned — "Referral reward" EARNED
 * transactions minus any "Refund clawback" REDEEMED transactions (see
 * lib/referral.ts and lib/refund.ts) — rather than every EARNED
 * transaction, since EARNED is also used for unrelated refund-restored
 * credit that has nothing to do with referring anyone.
 */
export async function getTopReferrersByCredit(limit = 10): Promise<LeaderboardEntry[]> {
  const [earned, clawedBack] = await Promise.all([
    prisma.creditTransaction.groupBy({
      by: ["userId"],
      where: { type: "EARNED", description: { startsWith: "Referral reward" } },
      _sum: { amount: true },
    }),
    prisma.creditTransaction.groupBy({
      by: ["userId"],
      where: { type: "REDEEMED", description: { startsWith: "Refund clawback" } },
      _sum: { amount: true },
    }),
  ]);

  const netByUserId = new Map<string, number>();
  for (const row of earned) {
    netByUserId.set(row.userId, (netByUserId.get(row.userId) ?? 0) + Number(row._sum.amount ?? 0));
  }
  for (const row of clawedBack) {
    netByUserId.set(row.userId, (netByUserId.get(row.userId) ?? 0) - Number(row._sum.amount ?? 0));
  }

  const ranked = Array.from(netByUserId.entries())
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (ranked.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: ranked.map(([userId]) => userId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return ranked.map(([userId, amount], i) => ({
    userId,
    displayName: formatReferrerDisplayName(nameById.get(userId) ?? "Student"),
    value: Math.round(amount * 100) / 100,
    rank: i + 1,
  }));
}
