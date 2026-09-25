import { prisma } from "@/lib/prisma";
import { eventCalendarEmailLinks } from "@/lib/eventCalendar";
import { SITE_URL } from "@/lib/siteUrl";
import { settleReferralCredit, InsufficientCreditError } from "@/lib/referral";
import { createRefund } from "@/lib/razorpay";
import { claimCouponRedemption } from "@/lib/coupon";
import { withEnrollmentNumber } from "@/lib/enrollment";
import { withEnrollmentNumber as withCompetitionEnrollmentNumber } from "@/lib/competitionEnrollment";
import { sendEventRegistrationConfirmationEmail, sendCompetitionEntryConfirmationEmail } from "@/lib/email";
import { leaveEventWaitlist } from "@/lib/waitlist";

/**
 * A captured payment that can't be honored — the event filled up, or the
 * credit the buyer applied at checkout was already spent on another purchase
 * (two checkouts open at once) — is refunded automatically instead of being
 * settled. Settling it anyway would hand over a seat that doesn't exist, or
 * an item for less than its price (and a later refund would then "restore"
 * credit that was never deducted).
 */
export class PaymentNotHonoredError extends Error {
  constructor(readonly reason: "EVENT_FULL" | "CREDIT_UNAVAILABLE" | "NOT_SETTLED") {
    super(reason);
  }
}

export class EventFullError extends PaymentNotHonoredError {
  constructor() {
    super("EVENT_FULL");
  }
}

/** What to tell the buyer when their payment was refunded instead of settled. */
export function paymentNotHonoredMessage(err: PaymentNotHonoredError): string {
  switch (err.reason) {
    case "EVENT_FULL":
      return "Your payment went through but the event filled up in the meantime, so it has been refunded automatically. Refunds reach your account in 5–7 working days.";
    case "CREDIT_UNAVAILABLE":
      return "Your credit balance was already used on another purchase, so this payment has been refunded automatically. Please check out again. Refunds reach your account in 5–7 working days.";
    default:
      return "This payment can't be completed. If money left your account, please contact support.";
  }
}

async function settleReferralCreditOrThrow(
  tx: Parameters<typeof settleReferralCredit>[0],
  args: Parameters<typeof settleReferralCredit>[1]
) {
  try {
    await settleReferralCredit(tx, args);
  } catch (err) {
    if (err instanceof InsufficientCreditError) throw new PaymentNotHonoredError("CREDIT_UNAVAILABLE");
    throw err;
  }
}

/**
 * On PaymentNotHonoredError, refunds the captured payment and rethrows. The
 * PENDING → FAILED/CANCELLED claim makes sure only one caller (browser
 * verification or the webhook) ever issues the refund.
 */
async function refundIfNotHonored(
  err: unknown,
  claim: () => Promise<{ count: number }>,
  paymentId: string,
  label: string
): Promise<never> {
  if (err instanceof PaymentNotHonoredError && (await claim()).count > 0) {
    try {
      await createRefund(paymentId);
    } catch (refundErr) {
      console.error(`Automatic refund FAILED for payment ${paymentId} (${label}) — refund it manually in Razorpay:`, refundErr);
    }
  }
  throw err;
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

  const settled = await prisma.$transaction(async (tx) => {
    const claimed = await tx.coursePurchase.updateMany({
      where: { id: purchase.id, status: "PENDING" },
      data: { status: "SUCCESS", razorpayPaymentId: paymentId },
    });

    if (claimed.count > 0) {
      await settleReferralCreditOrThrow(tx, {
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
  }).catch((err) =>
    refundIfNotHonored(
      err,
      () =>
        prisma.coursePurchase.updateMany({
          where: { id: purchase.id, status: "PENDING" },
          data: { status: "FAILED", razorpayPaymentId: paymentId },
        }),
      paymentId,
      `course purchase ${purchase.id}`
    )
  );

  // Never report a refunded/failed purchase back as paid (e.g. a verification
  // replayed after a refund).
  if (settled.status !== "SUCCESS") throw new PaymentNotHonoredError("NOT_SETTLED");
  return settled;
}

/**
 * Marks an event registration CONFIRMED, claims a seat, and settles referral
 * credit — guarded the same way as settleCoursePurchase. If the event filled
 * up between checkout and payment capture, the payment is refunded
 * automatically and EventFullError is thrown.
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
          where: { id: registration.id, status: "PENDING" },
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

          await settleReferralCreditOrThrow(tx, {
            buyerId: registration.userId,
            originalAmount: Number(registration.amount),
            creditApplied: Number(registration.creditApplied),
            description: `Event: ${event.title}`,
          });
          await claimCouponRedemption(tx, registration.couponId);
          // A registered event no longer needs to be "saved for later".
          await tx.eventWishlist.deleteMany({
            where: { userId: registration.userId, eventId: event.id },
          });
        }

        const result = await tx.eventRegistration.findUniqueOrThrow({ where: { id: registration.id } });
        return { settled: result, isFreshSettlement: claimedRegistration.count > 0 };
      })
  ).catch((err) =>
    refundIfNotHonored(
      err,
      () =>
        prisma.eventRegistration.updateMany({
          where: { id: registration.id, status: "PENDING" },
          data: { status: "CANCELLED", razorpayPaymentId: paymentId },
        }),
      paymentId,
      `event registration ${registration.id}`
    )
  );
  if (settled.status !== "CONFIRMED" && settled.status !== "ATTENDED") {
    throw new PaymentNotHonoredError("NOT_SETTLED");
  }

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
      settled.enrollmentNumber,
      eventCalendarEmailLinks(event, SITE_URL)
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
          where: { id: entry.id, status: "PENDING" },
          data: { status: "SUCCESS", razorpayPaymentId: paymentId, enrollmentNumber },
        });

        if (claimed.count > 0) {
          await settleReferralCreditOrThrow(tx, {
            buyerId: entry.userId,
            originalAmount: Number(entry.amount),
            creditApplied: Number(entry.creditApplied),
            description: `Competition: ${competition.title}`,
          });
          await claimCouponRedemption(tx, entry.couponId);
          // An entered competition no longer needs to be "saved for later".
          await tx.competitionWishlist.deleteMany({
            where: { userId: entry.userId, competitionId: competition.id },
          });
        }

        const result = await tx.competitionEntry.findUniqueOrThrow({ where: { id: entry.id } });
        return { settled: result, isFreshSettlement: claimed.count > 0 };
      })
  ).catch((err) =>
    refundIfNotHonored(
      err,
      () =>
        prisma.competitionEntry.updateMany({
          where: { id: entry.id, status: "PENDING" },
          data: { status: "FAILED", razorpayPaymentId: paymentId },
        }),
      paymentId,
      `competition entry ${entry.id}`
    )
  );
  if (settled.status !== "SUCCESS") throw new PaymentNotHonoredError("NOT_SETTLED");

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
