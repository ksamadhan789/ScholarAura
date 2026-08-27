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
