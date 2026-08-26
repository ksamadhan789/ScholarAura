import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createRefund } from "@/lib/razorpay";
import { getReferralRatePercent } from "@/lib/referral";

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
  const reward = Math.round(originalAmount * (ratePercent / 100) * 100) / 100;
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

  if (purchase.razorpayPaymentId) {
    await createRefund(purchase.razorpayPaymentId);
  }

  return prisma.$transaction(async (tx) => {
    await tx.coursePurchase.update({ where: { id: purchaseId }, data: { status: "REFUNDED" } });
    await reverseCreditAndReferral(
      tx,
      purchase.userId,
      Number(purchase.amount),
      Number(purchase.creditApplied),
      `Course: ${purchase.course.title}`
    );
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

  if (registration.razorpayPaymentId) {
    await createRefund(registration.razorpayPaymentId);
  }

  return prisma.$transaction(async (tx) => {
    await tx.eventRegistration.update({ where: { id: registrationId }, data: { status: "REFUNDED" } });
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
    return tx.eventRegistration.findUniqueOrThrow({ where: { id: registrationId } });
  });
}

export async function refundCompetitionEntry(entryId: string) {
  const entry = await prisma.competitionEntry.findUnique({
    where: { id: entryId },
    include: { competition: true },
  });
  if (!entry) throw new Error("Entry not found");
  if (entry.status === "REFUNDED") throw new AlreadyRefundedError();
  if (entry.status !== "SUCCESS") throw new NotRefundableError();

  if (entry.razorpayPaymentId) {
    await createRefund(entry.razorpayPaymentId);
  }

  return prisma.$transaction(async (tx) => {
    await tx.competitionEntry.update({ where: { id: entryId }, data: { status: "REFUNDED" } });
    await reverseCreditAndReferral(
      tx,
      entry.userId,
      Number(entry.amount),
      Number(entry.creditApplied),
      `Competition: ${entry.competition.title}`
    );
    return tx.competitionEntry.findUniqueOrThrow({ where: { id: entryId } });
  });
}
