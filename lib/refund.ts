import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createRefund } from "@/lib/razorpay";
import { getReferralRatePercent } from "@/lib/referral";
import { notifyNextWaitlisted } from "@/lib/waitlist";

export class AlreadyRefundedError extends Error {
  constructor() {
    super("ALREADY_REFUNDED");
  }
}
export class NotRefundableError extends Error {
  constructor() {
    super("NOT_REFUNDABLE");
  }
}

/**
 * A refunded purchase/registration/entry shouldn't leave behind a still-valid,
 * publicly verifiable certificate — revoke one if it exists. updateMany so a
 * purchase with no issued certificate (the common case) is just a no-op.
 */
async function revokeCertificateForRefund(
  tx: Prisma.TransactionClient,
  where: { userId: string; courseId?: string; eventId?: string; competitionId?: string }
) {
  await tx.certificate.updateMany({
    where: { ...where, status: { not: "REVOKED" } },
    data: { status: "REVOKED", revokedAt: new Date(), revokedReason: "Refunded" },
  });
}

/**
 * Reverses the credit-side effects of a purchase inside the same transaction
 * that flips its status to REFUNDED: gives back any credit the buyer
 * applied, and claws back the referral reward paid to their referrer
 * (best-effort — if the referrer already spent it, the clawback is skipped
 * and logged rather than driving their balance negative, the same tradeoff
 * the forward settlement path already makes for the opposite failure mode).
 */
async function reverseCreditAndReferral(
  tx: Prisma.TransactionClient,
  buyerId: string,
  originalAmount: number,
  creditApplied: number,
  description: string
) {
  if (creditApplied > 0) {
    await tx.user.update({
      where: { id: buyerId },
      data: { creditBalance: { increment: creditApplied } },
    });
    await tx.creditTransaction.create({
      data: {
        userId: buyerId,
        amount: creditApplied,
        type: "EARNED",
        description: `Refund — credit restored for ${description}`,
      },
    });
  }

  const buyer = await tx.user.findUnique({ where: { id: buyerId } });
  if (!buyer?.referredById) return;

  const referrer = await tx.user.findUnique({ where: { id: buyer.referredById } });
  if (!referrer) return;

  const ratePercent = getReferralRatePercent(referrer);
  // Must mirror settleReferralCredit's cash-paid basis exactly, or a refund
  // would claw back more (or less) than the referrer was actually paid.
  const cashPaid = Math.max(0, originalAmount - creditApplied);
  const reward = Math.round(cashPaid * (ratePercent / 100) * 100) / 100;
  if (reward <= 0) return;

  const clawedBack = await tx.user.updateMany({
    where: { id: referrer.id, creditBalance: { gte: reward } },
    data: { creditBalance: { decrement: reward } },
  });
  if (clawedBack.count === 0) {
    console.error(
      `Could not claw back referral reward of ${reward} from referrer ${referrer.id} — balance already spent (refund: ${description})`
    );
    return;
  }
  await tx.creditTransaction.create({
    data: {
      userId: referrer.id,
      amount: reward,
      type: "REDEEMED",
      description: `Refund clawback — referral reward reversed for ${description}`,
    },
  });
}

export async function refundCoursePurchase(purchaseId: string) {
  const purchase = await prisma.coursePurchase.findUnique({
    where: { id: purchaseId },
    include: { course: true },
  });
  if (!purchase) throw new Error("Purchase not found");
  if (purchase.status === "REFUNDED") throw new AlreadyRefundedError();
  if (purchase.status !== "SUCCESS") throw new NotRefundableError();

  // Atomic claim before touching Razorpay — this is what stops two callers
  // (e.g. the admin refund button and an approved refund request) racing on
  // the same purchase from both issuing a real refund. Whichever caller's
  // updateMany actually flips the row wins; the loser sees count === 0.
  const claimed = await prisma.coursePurchase.updateMany({
    where: { id: purchaseId, status: "SUCCESS" },
    data: { status: "REFUNDED" },
  });
  if (claimed.count === 0) throw new AlreadyRefundedError();

  if (purchase.razorpayPaymentId) {
    try {
      await createRefund(purchase.razorpayPaymentId);
    } catch (err) {
      // The refund never actually happened — release the claim so this can be retried.
      await prisma.coursePurchase.updateMany({
        where: { id: purchaseId, status: "REFUNDED" },
        data: { status: "SUCCESS" },
      });
      throw err;
    }
  }

  return prisma.$transaction(async (tx) => {
    await reverseCreditAndReferral(
      tx,
      purchase.userId,
      Number(purchase.amount),
      Number(purchase.creditApplied),
      `Course: ${purchase.course.title}`
    );
    await revokeCertificateForRefund(tx, { userId: purchase.userId, courseId: purchase.courseId });
    return tx.coursePurchase.findUniqueOrThrow({ where: { id: purchaseId } });
  });
}

export async function refundEventRegistration(registrationId: string) {
  const registration = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    include: { event: true },
  });
  if (!registration) throw new Error("Registration not found");
  if (registration.status === "REFUNDED") throw new AlreadyRefundedError();
  if (registration.status !== "CONFIRMED") throw new NotRefundableError();

  const claimed = await prisma.eventRegistration.updateMany({
    where: { id: registrationId, status: "CONFIRMED" },
    data: { status: "REFUNDED" },
  });
  if (claimed.count === 0) throw new AlreadyRefundedError();

  if (registration.razorpayPaymentId) {
    try {
      await createRefund(registration.razorpayPaymentId);
    } catch (err) {
      await prisma.eventRegistration.updateMany({
        where: { id: registrationId, status: "REFUNDED" },
        data: { status: "CONFIRMED" },
      });
      throw err;
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // Frees the seat back up — guarded so it can never go negative.
    await tx.event.updateMany({
      where: { id: registration.eventId, seatsFilled: { gt: 0 } },
      data: { seatsFilled: { decrement: 1 } },
    });
    await reverseCreditAndReferral(
      tx,
      registration.userId,
      Number(registration.amount),
      Number(registration.creditApplied),
      `Event: ${registration.event.title}`
    );
    await revokeCertificateForRefund(tx, { userId: registration.userId, eventId: registration.eventId });
    return tx.eventRegistration.findUniqueOrThrow({ where: { id: registrationId } });
  });

  // Best-effort — a waitlist notification failure shouldn't undo the refund.
  await notifyNextWaitlisted(registration.eventId).catch((err) =>
    console.error(`Failed to notify next waitlisted user for event ${registration.eventId}:`, err)
  );

  return result;
}

export async function refundCompetitionEntry(entryId: string) {
  const entry = await prisma.competitionEntry.findUnique({
    where: { id: entryId },
    include: { competition: true },
  });
  if (!entry) throw new Error("Entry not found");
  if (entry.status === "REFUNDED") throw new AlreadyRefundedError();
  if (entry.status !== "SUCCESS") throw new NotRefundableError();

  const claimed = await prisma.competitionEntry.updateMany({
    where: { id: entryId, status: "SUCCESS" },
    data: { status: "REFUNDED" },
  });
  if (claimed.count === 0) throw new AlreadyRefundedError();

  if (entry.razorpayPaymentId) {
    try {
      await createRefund(entry.razorpayPaymentId);
    } catch (err) {
      await prisma.competitionEntry.updateMany({
        where: { id: entryId, status: "REFUNDED" },
        data: { status: "SUCCESS" },
      });
      throw err;
    }
  }

  return prisma.$transaction(async (tx) => {
    await reverseCreditAndReferral(
      tx,
      entry.userId,
      Number(entry.amount),
      Number(entry.creditApplied),
      `Competition: ${entry.competition.title}`
    );
    await revokeCertificateForRefund(tx, { userId: entry.userId, competitionId: entry.competitionId });
    return tx.competitionEntry.findUniqueOrThrow({ where: { id: entryId } });
  });
}
