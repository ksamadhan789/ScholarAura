import { prisma } from "@/lib/prisma";
import { jobSearchWhere, parseEmploymentType } from "@/lib/jobSearch";
import { sendJobAlertEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/siteUrl";
import { describeJobAlert, jobAlertSearchPath } from "@/lib/jobAlertLabels";
import { formatJobLocation } from "@/lib/jobCity";

export const MAX_ALERTS_PER_USER = 10;
/** Most jobs listed in one email; the rest are behind "see all matches". */
export const MAX_JOBS_PER_EMAIL = 10;

export class AlertLimitError extends Error {
  constructor() {
    super("ALERT_LIMIT");
  }
}

/**
 * Saves a /jobs search as an alert. Re-saving an identical active search
 * returns the existing alert instead of creating a duplicate.
 */
export async function createJobAlert(
  userId: string,
  filters: { query?: string | null; employmentType?: string | null; remoteOnly?: boolean; city?: string | null }
) {
  const data = {
    query: filters.query?.trim() || null,
    employmentType: parseEmploymentType(filters.employmentType),
    remoteOnly: Boolean(filters.remoteOnly),
    city: filters.city?.trim() || null,
  };

  const existing = await prisma.jobAlert.findFirst({ where: { userId, ...data } });
  if (existing) {
    if (!existing.isActive) {
      return prisma.jobAlert.update({ where: { id: existing.id }, data: { isActive: true } });
    }
    return existing;
  }

  const count = await prisma.jobAlert.count({ where: { userId } });
  if (count >= MAX_ALERTS_PER_USER) throw new AlertLimitError();

  return prisma.jobAlert.create({ data: { userId, ...data } });
}

/**
 * Run once a day from the reminders cron. For each active alert (of a
 * non-deleted account), finds published, approved, still-open jobs that match
 * it, were posted after the alert was created, and were never sent to it —
 * emails them, then records the deliveries so they're never sent again. An
 * alert with nothing new gets no email. A failed email records nothing, so
 * those jobs are retried the next day.
 */
export async function sendDueJobAlerts(now: Date = new Date()): Promise<{ emailsSent: number }> {
  const alerts = await prisma.jobAlert.findMany({
    where: { isActive: true, user: { deactivatedAt: null } },
    include: { user: { select: { email: true, name: true } } },
  });

  let emailsSent = 0;
  for (const alert of alerts) {
    const where = {
      ...jobSearchWhere(alert),
      isPublished: true,
      approvalStatus: "APPROVED" as const,
      createdAt: { gt: alert.createdAt },
      alertDeliveries: { none: { alertId: alert.id } },
      OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: now } }],
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({ where, orderBy: { createdAt: "desc" }, take: MAX_JOBS_PER_EMAIL }),
      prisma.job.count({ where }),
    ]);
    if (jobs.length === 0) continue;

    const ok = await sendJobAlertEmail(alert.user.email, alert.user.name, {
      alertName: describeJobAlert(alert),
      jobs: jobs.map((j) => ({
        title: j.title,
        companyName: j.companyName,
        place: j.isRemote ? "Remote" : formatJobLocation(j),
        url: `${SITE_URL}/jobs/${j.slug}`,
      })),
      totalMatches: total,
      searchUrl: `${SITE_URL}${jobAlertSearchPath(alert)}`,
      manageUrl: `${SITE_URL}/dashboard/job-alerts`,
      unsubscribeUrl: `${SITE_URL}/job-alerts/unsubscribe/${alert.id}`,
    });
    if (!ok) continue;

    // Record every matching job (not just the ones listed) so the "see all"
    // overflow isn't re-sent tomorrow either.
    const allIds =
      total > jobs.length
        ? (await prisma.job.findMany({ where, select: { id: true } })).map((j) => j.id)
        : jobs.map((j) => j.id);
    await prisma.$transaction([
      prisma.jobAlertDelivery.createMany({
        data: allIds.map((jobId) => ({ alertId: alert.id, jobId })),
        skipDuplicates: true,
      }),
      prisma.jobAlert.update({ where: { id: alert.id }, data: { lastSentAt: now } }),
    ]);
    emailsSent++;
  }

  return { emailsSent };
}
