export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
};

export const EMPLOYMENT_TYPE_TABS: { type: string; label: string }[] = [
  { type: "FULL_TIME", label: "Full-time" },
  { type: "PART_TIME", label: "Part-time" },
  { type: "INTERNSHIP", label: "Internship" },
  { type: "CONTRACT", label: "Contract" },
];

export const INTERNSHIP_PERKS = [
  "Certificate",
  "Letter of recommendation",
  "Flexible work hours",
  "5 days a week",
  "Informal dress code",
  "Free snacks & beverages",
  "Job offer",
] as const;

export const JOB_APPLICATION_STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  HIRED: "Hired",
};

export function formatJobDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Posted today" / "yesterday" / "5 days ago", falling back to the date after a month. */
export function formatPostedAgo(date: Date, now = new Date()): string {
  const days = Math.floor((now.getTime() - date.getTime()) / DAY_MS);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${formatJobDate(date)}`;
}

/** A job posted in the last 3 days gets a "New" tag. */
export function isNewJob(date: Date, now = new Date()): boolean {
  return now.getTime() - date.getTime() < 3 * DAY_MS;
}

/** "Closes today" / "Closes in 3 days" when the application deadline is within a week, else null. */
export function closingSoonLabel(deadline: Date | null, now = new Date()): string | null {
  if (!deadline) return null;
  const ms = deadline.getTime() - now.getTime();
  if (ms < 0 || ms > 7 * DAY_MS) return null;
  const days = Math.floor(ms / DAY_MS);
  return days === 0 ? "Closes today" : `Closes in ${days} day${days === 1 ? "" : "s"}`;
}
