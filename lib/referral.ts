import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_REFERRAL_RATE_PERCENT } from "@/lib/referralConstants";

export { DEFAULT_REFERRAL_RATE_PERCENT };

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion

function randomCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function generateReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = randomCode();
    const existing = await prisma.user.findUnique({ where: { referralCode: candidate } });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique referral code");
}

export function getReferralRatePercent(user: {
  isAffiliate: boolean;
  affiliateRatePercent: number | null;
}): number {
  if (user.isAffiliate && user.affiliateRatePercent != null) {
    return user.affiliateRatePercent;
  }
  return DEFAULT_REFERRAL_RATE_PERCENT;
}

export async function computeCreditApplication(userId: string, price: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const balance = Number(user?.creditBalance ?? 0);
  const creditApplied = Math.min(balance, price);
  const amountDue = Math.round((price - creditApplied) * 100) / 100;
  return { creditApplied, amountDue };
}

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Deducts any credit the buyer applied to this purchase, and pays a referral
 * reward to whoever referred them, based on the pre-discount price. Must run
 * inside the same transaction that marks the purchase successful.
 */
export async function settleReferralCredit(
  tx: TxClient,
  {
    buyerId,
    originalAmount,
    creditApplied,
    description,
  }: { buyerId: string; originalAmount: number; creditApplied: number; description: string }
) {
  const buyer = await tx.user.findUnique({ where: { id: buyerId } });
  if (!buyer) return;

  if (creditApplied > 0) {
    await tx.user.update({
      where: { id: buyerId },
      data: { creditBalance: { decrement: creditApplied } },
    });
    await tx.creditTransaction.create({
      data: {
        userId: buyerId,
        amount: creditApplied,
        type: "REDEEMED",
        description: `Credit applied — ${description}`,
      },
    });
  }

  if (!buyer.referredById) return;

  const referrer = await tx.user.findUnique({ where: { id: buyer.referredById } });
  if (!referrer) return;

  const ratePercent = getReferralRatePercent(referrer);
  const reward = Math.round(originalAmount * (ratePercent / 100) * 100) / 100;
  if (reward <= 0) return;

  await tx.user.update({
    where: { id: referrer.id },
    data: { creditBalance: { increment: reward } },
  });
  await tx.creditTransaction.create({
    data: {
      userId: referrer.id,
      amount: reward,
      type: "EARNED",
      description: `Referral reward (${ratePercent}%) — ${description}`,
    },
  });
}
