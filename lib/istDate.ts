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

// Admin forms use <input type="datetime-local">, which sends a bare
// "YYYY-MM-DDTHH:mm" with no time zone. The admin means India time, but
// the server runs in UTC, so parsing it as-is stored every time 5h30m late.
const BARE_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

/** Reads a bare datetime-local value as IST; anything else (with a zone, a Date, empty) passes through unchanged. */
export function fromIstInput(value: unknown): unknown {
  if (typeof value !== "string" || !BARE_DATE_TIME.test(value)) return value;
  return new Date(`${value.length === 16 ? `${value}:00` : value}+05:30`);
}

/** The IST wall-clock "YYYY-MM-DDTHH:mm" for a datetime-local input's value. */
export function toIstInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() + 330 * 60 * 1000).toISOString().slice(0, 16);
}
