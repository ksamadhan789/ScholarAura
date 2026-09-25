import type { RecruiterPlanPeriod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendRecruiterPlanEndingEmail } from "@/lib/email";

// Recruiter plans (owner's choice, 2026-09-25): Free = 2 live jobs; Pro =
// 10 live jobs + 1 included Boost every 30 days, ₹499/month or ₹4,990/year.
// Paid upfront through Razorpay and renewed by hand — never auto-charged.
// Jobs already live when a limit applies stay live; the limit only stops
// *new* jobs from going live.

export const FREE_LIVE_JOB_LIMIT = 2;
export const PRO_LIVE_JOB_LIMIT = 10;
export const PRO_INCLUDED_BOOSTS_PER_PERIOD = 1;

export const PRO_PRICE_INR: Record<RecruiterPlanPeriod, number> = { MONTHLY: 499, YEARLY: 4990 };
export const PLAN_DURATION_DAYS: Record<RecruiterPlanPeriod, number> = { MONTHLY: 30, YEARLY: 365 };
/** Included Boosts renew every this many days while Pro is active. */
export const BOOST_CREDIT_PERIOD_DAYS = 30;
/** A yearly plan grants at most this many included Boosts (12 × 30 days, not 13 for the last 5 days). */
const MAX_BOOST_PERIODS: Record<RecruiterPlanPeriod, number> = { MONTHLY: 1, YEARLY: 12 };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Rows are PAID Pro periods (status SUCCESS with a window). */
export type PaidPeriod = { period: RecruiterPlanPeriod; startsAt: Date; endsAt: Date };

/**
 * Where a newly paid period goes: straight after the latest paid period if
 * that's still running (so renewing early never loses days), otherwise now.
 */
export function nextPeriodWindow(
  period: RecruiterPlanPeriod,
  latestEndsAt: Date | null,
  now: Date = new Date(),
): { startsAt: Date; endsAt: Date } {
  const startsAt = latestEndsAt && latestEndsAt > now ? latestEndsAt : now;
  return { startsAt, endsAt: new Date(startsAt.getTime() + PLAN_DURATION_DAYS[period] * DAY_MS) };
}

/** The paid period covering `now`, if any. */
export function activePeriod<T extends PaidPeriod>(periods: T[], now: Date = new Date()): T | null {
  return periods.find((p) => p.startsAt <= now && now < p.endsAt) ?? null;
}

/** When Pro stops, following any back-to-back renewals from the active period. */
export function proActiveUntil(periods: PaidPeriod[], now: Date = new Date()): Date | null {
  const current = activePeriod(periods, now);
  if (!current) return null;
  let until = current.endsAt;
  const sorted = [...periods].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  for (const p of sorted) {
    if (p.startsAt.getTime() <= until.getTime() && p.endsAt > until) until = p.endsAt;
  }
  return until;
}

/**
 * The current included-Boost window inside the active period: it starts at
 * the period start and rolls every 30 days. Null when no Boost is included
 * right now (no active period, or the last few days of a yearly plan).
 */
export function boostCreditWindow(active: PaidPeriod | null, now: Date = new Date()): { from: Date; to: Date } | null {
  if (!active) return null;
  const index = Math.floor((now.getTime() - active.startsAt.getTime()) / (BOOST_CREDIT_PERIOD_DAYS * DAY_MS));
  if (index < 0 || index >= MAX_BOOST_PERIODS[active.period]) return null;
  const from = new Date(active.startsAt.getTime() + index * BOOST_CREDIT_PERIOD_DAYS * DAY_MS);
  const to = new Date(Math.min(from.getTime() + BOOST_CREDIT_PERIOD_DAYS * DAY_MS, active.endsAt.getTime()));
  return { from, to };
}

/** Does this job use up one of the recruiter's live-job slots? Pending jobs do — approval publishes them. */
export function countsTowardLiveLimit(job: { approvalStatus: string; isPublished: boolean }): boolean {
  return job.approvalStatus === "PENDING" || (job.approvalStatus === "APPROVED" && job.isPublished);
}

export type RecruiterPlanStatus = {
  plan: "FREE" | "PRO";
  /** When Pro ends (including renewals already paid for); null on Free. */
  proUntil: Date | null;
  liveJobLimit: number;
  liveJobCount: number;
  /** Included Boosts left in the current 30-day window. */
  includedBoostsLeft: number;
  /** When the next included Boost becomes available (end of the current window), if on Pro. */
  includedBoostsRenewAt: Date | null;
};

export async function getPaidPeriods(userId: string): Promise<PaidPeriod[]> {
  const rows = await prisma.recruiterSubscription.findMany({
    where: { userId, status: "SUCCESS", startsAt: { not: null }, endsAt: { not: null } },
    select: { period: true, startsAt: true, endsAt: true },
  });
  return rows.map((r) => ({ period: r.period, startsAt: r.startsAt!, endsAt: r.endsAt! }));
}

export async function countLiveJobs(userId: string): Promise<number> {
  return prisma.job.count({
    where: {
      postedByUserId: userId,
      recruiterProfileId: { not: null },
      OR: [{ approvalStatus: "PENDING" }, { approvalStatus: "APPROVED", isPublished: true }],
    },
  });
}

/**
 * Included Boosts are JobBoost rows with no Razorpay order. PENDING counts
 * too: /api/jobs/[slug]/boost/use-included creates the row and settles it
 * right after, and a second click in between must not see the Boost as free.
 */
async function countIncludedBoostsSince(userId: string, from: Date): Promise<number> {
  return prisma.jobBoost.count({
    where: {
      purchasedByUserId: userId,
      razorpayOrderId: null,
      status: { in: ["PENDING", "SUCCESS"] },
      purchasedAt: { gte: from },
    },
  });
}

export async function getRecruiterPlanStatus(userId: string, now: Date = new Date()): Promise<RecruiterPlanStatus> {
  const [periods, liveJobCount] = await Promise.all([getPaidPeriods(userId), countLiveJobs(userId)]);
  const active = activePeriod(periods, now);
  if (!active) {
    return {
      plan: "FREE",
      proUntil: null,
      liveJobLimit: FREE_LIVE_JOB_LIMIT,
      liveJobCount,
      includedBoostsLeft: 0,
      includedBoostsRenewAt: null,
    };
  }
  const window = boostCreditWindow(active, now);
  const used = window ? await countIncludedBoostsSince(userId, window.from) : 0;
  return {
    plan: "PRO",
    proUntil: proActiveUntil(periods, now),
    liveJobLimit: PRO_LIVE_JOB_LIMIT,
    liveJobCount,
    includedBoostsLeft: window ? Math.max(0, PRO_INCLUDED_BOOSTS_PER_PERIOD - used) : 0,
    includedBoostsRenewAt: window ? window.to : null,
  };
}

/** Message shown when a recruiter hits their live-job limit. */
export function liveJobLimitMessage(status: RecruiterPlanStatus): string {
  return status.plan === "FREE"
    ? `The Free plan allows ${FREE_LIVE_JOB_LIMIT} live jobs at a time (pending review counts). Pause or close one, or upgrade to Pro for up to ${PRO_LIVE_JOB_LIMIT}.`
    : `Your Pro plan allows ${PRO_LIVE_JOB_LIMIT} live jobs at a time (pending review counts). Pause or close one to post another.`;
}

/**
 * Marks a Pro payment SUCCESS and gives it its window — idempotent, since the
 * browser confirmation and the Razorpay webhook both call it. The row is
 * claimed first (PENDING → SUCCESS) so two concurrent calls can't both set
 * a window.
 */
export async function settleRecruiterSubscription(subscriptionId: string, paymentId: string) {
  return prisma.$transaction(async (tx) => {
    const sub = await tx.recruiterSubscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) return null;
    const claimed = await tx.recruiterSubscription.updateMany({
      where: { id: sub.id, status: "PENDING" },
      data: { status: "SUCCESS", razorpayPaymentId: paymentId },
    });
    if (claimed.count > 0) {
      // Serialise per user, so two payments settling at once can't both
      // read the same "latest end" and overlap their windows.
      await tx.$executeRaw`SELECT id FROM users WHERE id = ${sub.userId} FOR UPDATE`;
      const latest = await tx.recruiterSubscription.findFirst({
        where: { userId: sub.userId, status: "SUCCESS", endsAt: { not: null }, id: { not: sub.id } },
        orderBy: { endsAt: "desc" },
        select: { endsAt: true },
      });
      const window = nextPeriodWindow(sub.period, latest?.endsAt ?? null);
      await tx.recruiterSubscription.update({ where: { id: sub.id }, data: window });
    }
    return tx.recruiterSubscription.findUniqueOrThrow({ where: { id: sub.id } });
  });
}

/** How far ahead the "your plan ends soon" email goes out. */
export const PLAN_ENDING_REMINDER_DAYS = 3;

/**
 * Daily (from the send-reminders cron): email recruiters whose Pro ends in
 * the next few days and who haven't already paid for the next period. One
 * email per paid period (reminderSentAt).
 */
export async function sendPlanEndingReminders(now: Date = new Date()): Promise<number> {
  const horizon = new Date(now.getTime() + PLAN_ENDING_REMINDER_DAYS * DAY_MS);
  const ending = await prisma.recruiterSubscription.findMany({
    where: { status: "SUCCESS", reminderSentAt: null, endsAt: { gt: now, lte: horizon } },
    include: { user: { select: { email: true, name: true, deactivatedAt: true } } },
  });
  let sent = 0;
  for (const sub of ending) {
    const renewed = await prisma.recruiterSubscription.count({
      where: { userId: sub.userId, status: "SUCCESS", startsAt: { gte: sub.endsAt! } },
    });
    if (renewed === 0 && !sub.user.deactivatedAt) {
      const ok = await sendRecruiterPlanEndingEmail(sub.user.email, sub.user.name, sub.endsAt!);
      if (!ok) continue;
      sent += 1;
    }
    await prisma.recruiterSubscription.update({ where: { id: sub.id }, data: { reminderSentAt: now } });
  }
  return sent;
}
