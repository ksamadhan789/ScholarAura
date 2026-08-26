import { prisma } from "@/lib/prisma";
import { settleReferralCredit, InsufficientCreditError } from "@/lib/referral";
import { withEnrollmentNumber } from "@/lib/enrollment";
import { withEnrollmentNumber as withCompetitionEnrollmentNumber } from "@/lib/competitionEnrollment";

/**
 * Settles referral credit but never lets an already-captured payment fail to
 * confirm just because the buyer's credit balance was spent elsewhere in the
 * window between checkout and payment verification — that's a rarer,
 * lower-stakes edge case than leaving a paying customer unregistered.
 */
async function settleReferralCreditBestEffort(
  tx: Parameters<typeof settleReferralCredit>[0],
  args: Parameters<typeof settleReferralCredit>[1]
) {
  try {
    await settleReferralCredit(tx, args);
  } catch (err) {
    if (err instanceof InsufficientCreditError) {
      console.error(
        `Credit balance insufficient at settlement for user ${args.buyerId} (${args.description}) — payment still honored, credit not deducted.`
      );
      return;
    }
    throw err;
  }
}

export class EventFullError extends Error {
  constructor() {
    super("EVENT_FULL");
  }
}

async function bumpCouponRedemption(tx: Parameters<typeof settleReferralCredit>[0], couponId: string | null) {
  if (!couponId) return;
  await tx.coupon.update({ where: { id: couponId }, data: { redemptionCount: { increment: 1 } } });
}

/**
 * Marks a course purchase SUCCESS and settles referral credit, guarded so
 * this can be called more than once for the same purchase (browser
 * confirmation and the Razorpay webhook both call this) without double
 * paying a referrer.
 */
export async function settleCoursePurchase(purchaseId: string, paymentId: string) {
  const purchase = await prisma.coursePurchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return null;

  const course = await prisma.course.findUnique({ where: { id: purchase.courseId } });
  if (!course) return null;

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.coursePurchase.updateMany({
      where: { id: purchase.id, status: { not: "SUCCESS" } },
      data: { status: "SUCCESS", razorpayPaymentId: paymentId },
    });

    if (claimed.count > 0) {
      await settleReferralCreditBestEffort(tx, {
        buyerId: purchase.userId,
        originalAmount: Number(purchase.amount),
        creditApplied: Number(purchase.creditApplied),
        description: `Course: ${course.title}`,
      });
      await bumpCouponRedemption(tx, purchase.couponId);
    }

    return tx.coursePurchase.findUniqueOrThrow({ where: { id: purchase.id } });
  });
}

/**
 * Marks an event registration CONFIRMED, claims a seat, and settles referral
 * credit — guarded the same way as settleCoursePurchase. Throws EventFullError
 * if the event filled up between checkout and payment capture (the payment
 * already succeeded at that point, so this needs a human to sort out).
 */
export async function settleEventRegistration(registrationId: string, paymentId: string) {
  const registration = await prisma.eventRegistration.findUnique({ where: { id: registrationId } });
  if (!registration) return null;

  const event = await prisma.event.findUnique({ where: { id: registration.eventId } });
  if (!event) return null;

  return withEnrollmentNumber(registration.enrollmentNumber, (enrollmentNumber) =>
    prisma.$transaction(async (tx) => {
      const claimedRegistration = await tx.eventRegistration.updateMany({
        where: { id: registration.id, status: { not: "CONFIRMED" } },
        data: { status: "CONFIRMED", razorpayPaymentId: paymentId, enrollmentNumber },
      });

      if (claimedRegistration.count > 0) {
        const claimedSeat = await tx.event.updateMany({
          where: { id: event.id, seatsFilled: { lt: event.seatsTotal } },
          data: { seatsFilled: { increment: 1 } },
        });

        if (claimedSeat.count === 0) {
          throw new EventFullError();
        }

        await settleReferralCreditBestEffort(tx, {
          buyerId: registration.userId,
          originalAmount: Number(registration.amount),
          creditApplied: Number(registration.creditApplied),
          description: `Event: ${event.title}`,
        });
        await bumpCouponRedemption(tx, registration.couponId);
      }

      return tx.eventRegistration.findUniqueOrThrow({ where: { id: registration.id } });
    })
  );
}

/**
 * Marks a competition entry SUCCESS and settles referral credit, guarded
 * the same way as settleCoursePurchase/settleEventRegistration.
 */
export async function settleCompetitionEntry(entryId: string, paymentId: string) {
  const entry = await prisma.competitionEntry.findUnique({ where: { id: entryId } });
  if (!entry) return null;

  const competition = await prisma.competition.findUnique({ where: { id: entry.competitionId } });
  if (!competition) return null;

  return withCompetitionEnrollmentNumber(entry.enrollmentNumber, (enrollmentNumber) =>
    prisma.$transaction(async (tx) => {
      const claimed = await tx.competitionEntry.updateMany({
        where: { id: entry.id, status: { not: "SUCCESS" } },
        data: { status: "SUCCESS", razorpayPaymentId: paymentId, enrollmentNumber },
      });

      if (claimed.count > 0) {
        await settleReferralCreditBestEffort(tx, {
          buyerId: entry.userId,
          originalAmount: Number(entry.amount),
          creditApplied: Number(entry.creditApplied),
          description: `Competition: ${competition.title}`,
        });
        await bumpCouponRedemption(tx, entry.couponId);
      }

      return tx.competitionEntry.findUniqueOrThrow({ where: { id: entry.id } });
    })
  );
}
