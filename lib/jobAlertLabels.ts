import { EMPLOYMENT_TYPE_LABELS } from "@/lib/jobLabels";

// Client-safe (no Prisma) — used by the alert button, the dashboard page and
// the alert email alike.

export type JobAlertFilters = {
  query: string | null;
  employmentType: string | null;
  remoteOnly: boolean;
  city: string | null;
};

/** "Internship jobs · Bengaluru · matching "data"" — a human name for an alert. */
export function describeJobAlert(alert: JobAlertFilters): string {
  const type = alert.employmentType ? EMPLOYMENT_TYPE_LABELS[alert.employmentType] ?? alert.employmentType : null;
  const parts = [
    type ? `${type} jobs` : "All jobs",
    ...(alert.remoteOnly ? ["Remote"] : []),
    ...(alert.city ? [alert.city] : []),
    ...(alert.query?.trim() ? [`matching "${alert.query.trim()}"`] : []),
  ];
  return parts.join(" · ");
}

/** The /jobs URL (path + query) that shows the same results as the alert. */
export function jobAlertSearchPath(alert: JobAlertFilters): string {
  const params = new URLSearchParams();
  if (alert.query?.trim()) params.set("q", alert.query.trim());
  if (alert.employmentType) params.set("employmentType", alert.employmentType);
  if (alert.remoteOnly) params.set("remote", "true");
  // Always explicit (empty = any location), so the viewer's own saved
  // location cookie doesn't narrow the results the alert email linked to.
  params.set("city", alert.city ?? "");
  return `/jobs?${params.toString()}`;
}
