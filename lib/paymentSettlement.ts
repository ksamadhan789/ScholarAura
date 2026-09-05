import { prisma } from "@/lib/prisma";
import { settleReferralCredit, InsufficientCreditError } from "@/lib/referral";
import { claimCouponRedemption } from "@/lib/coupon";
import { withEnrollmentNumber } from "@/lib/enrollment";
import { withEnrollmentNumber as withCompetitionEnrollmentNumber } from "@/lib/competitionEnrollment";
import { sendEventRegistrationConfirmationEmail, sendCompetitionEntryConfirmationEmail } from "@/lib/email";
import { leaveEventWaitlist } from "@/lib/waitlist";

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
      await claimCouponRedemption(tx, purchase.couponId);
      // A purchased course no longer needs to be "saved for later".
      await tx.courseWishlist.deleteMany({
        where: { userId: purchase.userId, courseId: purchase.courseId },
      });
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
  const registration = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    include: { user: true },
  });
  if (!registration) return null;

  const event = await prisma.event.findUnique({ where: { id: registration.eventId } });
  if (!event) return null;

  const { settled, isFreshSettlement } = await withEnrollmentNumber(
    registration.enrollmentNumber,
    (enrollmentNumber) =>
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
          await claimCouponRedemption(tx, registration.couponId);
        }

        const result = await tx.eventRegistration.findUniqueOrThrow({ where: { id: registration.id } });
        return { settled: result, isFreshSettlement: claimedRegistration.count > 0 };
      })
  );

  if (isFreshSettlement) {
    // Same cleanup as the free-registration path — a confirmed seat means
    // this user is no longer "waiting" for one.
    await leaveEventWaitlist(registration.userId, event.id).catch((err) =>
      console.error(`Failed to clear waitlist entry for user ${registration.userId} on event ${event.id}:`, err)
    );
    await sendEventRegistrationConfirmationEmail(
      registration.user.email,
      registration.user.name,
      event.title,
      event.startDate,
      event.venueOrLink,
      settled.enrollmentNumber
    ).catch((err) => console.error("Failed to send event registration confirmation email:", err));
  }

  return settled;
}

/**
 * Marks a competition entry SUCCESS and settles referral credit, guarded
 * the same way as settleCoursePurchase/settleEventRegistration.
 */
export async function settleCompetitionEntry(entryId: string, paymentId: string) {
  const entry = await prisma.competitionEntry.findUnique({
    where: { id: entryId },
    include: { user: true },
  });
  if (!entry) return null;

  const competition = await prisma.competition.findUnique({ where: { id: entry.competitionId } });
  if (!competition) return null;

  const { settled, isFreshSettlement } = await withCompetitionEnrollmentNumber(
    entry.enrollmentNumber,
    (enrollmentNumber) =>
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
          await claimCouponRedemption(tx, entry.couponId);
        }

        const result = await tx.competitionEntry.findUniqueOrThrow({ where: { id: entry.id } });
        return { settled: result, isFreshSettlement: claimed.count > 0 };
      })
  );

  if (isFreshSettlement) {
    await sendCompetitionEntryConfirmationEmail(
      entry.user.email,
      entry.user.name,
      competition.title,
      competition.submissionDeadline,
      settled.enrollmentNumber
    ).catch((err) => console.error("Failed to send competition entry confirmation email:", err));
  }

  return settled;
}
