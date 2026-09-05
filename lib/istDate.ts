const IST_TIME_ZONE = "Asia/Kolkata";

/**
 * The calendar year in IST for a given instant. A UTC-based server year
 * (`date.getFullYear()`) is already wrong for the last 5.5 hours of every
 * UTC year, since IST is UTC+5:30 — used for per-year sequential
 * identifiers (enrollment/certificate numbers) so the sequence rolls over
 * at India midnight, matching what students and admins actually see.
 */
export function getIstYear(date: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: IST_TIME_ZONE, year: "numeric" }).format(date));
}

/** The "YYYY-MM" bucket in IST for a given instant, for monthly grouping. */
export function getIstMonthKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  return `${year}-${month}`;
}
