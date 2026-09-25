// Pure helpers for the homepage trust section (components/home/HomeTrust*.tsx).
// The numbers come from lib/homeTrustStats.ts; nothing here touches the
// database, so it's safe to unit-test and to import anywhere.

/** A stat below this is left off the homepage — "3 certificates issued" undersells more than it reassures. */
export const TRUST_STAT_MIN = 50;

/** The stats band only appears once at least this many stats clear TRUST_STAT_MIN. */
export const TRUST_STATS_MIN_SHOWN = 2;

export type TrustCounts = {
  members: number;
  certificates: number;
  eventsHosted: number;
  eventRegistrations: number;
  competitionEntries: number;
};

export type TrustStat = { key: keyof TrustCounts; value: string; label: string };

const TRUST_STAT_LABELS: Record<keyof TrustCounts, string> = {
  members: "members",
  certificates: "certificates issued",
  eventsHosted: "events hosted",
  eventRegistrations: "event registrations",
  competitionEntries: "competition entries",
};

/**
 * Rounds a real count *down* and adds "+", so the homepage never overstates:
 * 137 → "130+", 1,284 → "1,200+", 23,950 → "23,000+". Below 10 it's exact.
 */
export function formatTrustCount(n: number): string {
  if (n < 10) return String(n);
  const step = n < 1000 ? 10 : n < 10000 ? 100 : 1000;
  return `${(Math.floor(n / step) * step).toLocaleString("en-IN")}+`;
}

/**
 * The stats worth showing, in display order — each at least TRUST_STAT_MIN,
 * and an empty list unless at least TRUST_STATS_MIN_SHOWN qualify.
 */
export function pickTrustStats(counts: TrustCounts): TrustStat[] {
  const stats = (Object.keys(TRUST_STAT_LABELS) as (keyof TrustCounts)[])
    .filter((key) => counts[key] >= TRUST_STAT_MIN)
    .map((key) => ({ key, value: formatTrustCount(counts[key]), label: TRUST_STAT_LABELS[key] }));
  return stats.length >= TRUST_STATS_MIN_SHOWN ? stats : [];
}

/** "Priya Sharma" → "Priya S." — enough to feel real without putting a full name on the homepage. */
export function shortReviewerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A learner";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
