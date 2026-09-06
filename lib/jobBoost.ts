import { prisma } from "@/lib/prisma";

export const JOB_BOOST_PRICE_INR = 999;
export const JOB_BOOST_DURATION_DAYS = 30;

/**
 * Marks a job boost SUCCESS and extends the job's featured window —
 * guarded so this can be called more than once for the same purchase
 * (browser confirmation and the Razorpay webhook both call this) without
 * double-extending the window.
 */
export async function settleJobBoost(boostId: string, paymentId: string) {
  const boost = await prisma.jobBoost.findUnique({ where: { id: boostId } });
  if (!boost) return null;

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.jobBoost.updateMany({
      where: { id: boost.id, status: { not: "SUCCESS" } },
      data: { status: "SUCCESS", razorpayPaymentId: paymentId },
    });

    if (claimed.count > 0) {
      const now = new Date();
      const job = await tx.job.findUnique({
        where: { id: boost.jobId },
        select: { featuredUntil: true },
      });
      // Extend from the later of now or the job's current featuredUntil, so
      // buying a second boost before the first expires stacks the duration
      // rather than resetting it.
      const base = job?.featuredUntil && job.featuredUntil > now ? job.featuredUntil : now;
      const expiresAt = new Date(base.getTime() + boost.durationDays * 24 * 60 * 60 * 1000);

      await tx.job.update({ where: { id: boost.jobId }, data: { featuredUntil: expiresAt } });
      await tx.jobBoost.update({ where: { id: boost.id }, data: { expiresAt } });
    }

    return tx.jobBoost.findUniqueOrThrow({ where: { id: boost.id } });
  });
}
