import { Coupon, CouponScope, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class CouponError extends Error {}

/**
 * Looks up a coupon by code and validates every rule except per-user
 * redemption (checked separately via hasUserRedeemedCoupon, since that
 * needs to know which of the three purchase tables to check). Throws
 * CouponError with a message safe to show the buyer directly.
 */
export async function findValidCoupon(
  code: string,
  scope: Exclude<CouponScope, "ALL">,
  amount: number
): Promise<Coupon> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.isActive) {
    throw new CouponError("Invalid coupon code");
  }
  if (coupon.appliesTo !== "ALL" && coupon.appliesTo !== scope) {
    throw new CouponError("This coupon doesn't apply to this purchase");
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new CouponError("This coupon has expired");
  }
  if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
    throw new CouponError("This coupon has reached its redemption limit");
  }
  if (coupon.minAmount != null && amount < Number(coupon.minAmount)) {
    throw new CouponError(`This coupon requires a minimum amount of ₹${coupon.minAmount}`);
  }
  return coupon;
}

/** A coupon can be redeemed once per user, across any of the three purchase types. */
export async function hasUserRedeemedCoupon(userId: string, couponId: string): Promise<boolean> {
  const [course, event, competition] = await Promise.all([
    prisma.coursePurchase.findFirst({ where: { userId, couponId, status: "SUCCESS" } }),
    prisma.eventRegistration.findFirst({ where: { userId, couponId, status: "CONFIRMED" } }),
    prisma.competitionEntry.findFirst({ where: { userId, couponId, status: "SUCCESS" } }),
  ]);
  return Boolean(course || event || competition);
}

export function computeDiscount(coupon: Pick<Coupon, "discountType" | "discountValue">, amount: number): number {
  const value = Number(coupon.discountValue);
  const raw = coupon.discountType === "PERCENT" ? (amount * value) / 100 : value;
  return Math.min(Math.round(raw * 100) / 100, amount);
}

/**
 * Bumps redemptionCount at settlement time — the only point a purchase is
 * known to have actually succeeded. findValidCoupon's maxRedemptions check
 * at checkout only rules out a coupon that was already exhausted before
 * this purchase started; it can't stop two checkouts that both passed that
 * check from both reaching settlement afterward. This atomic updateMany is
 * what actually caps redemptionCount at maxRedemptions when that race
 * happens — the loser still keeps the discount it already charged (the
 * payment is already captured by settlement time), but the count itself
 * never overshoots the limit.
 */
export async function claimCouponRedemption(tx: Prisma.TransactionClient, couponId: string | null): Promise<void> {
  if (!couponId) return;

  const coupon = await tx.coupon.findUnique({ where: { id: couponId }, select: { maxRedemptions: true } });
  if (!coupon) return;

  if (coupon.maxRedemptions == null) {
    await tx.coupon.update({ where: { id: couponId }, data: { redemptionCount: { increment: 1 } } });
    return;
  }

  const claimed = await tx.coupon.updateMany({
    where: { id: couponId, redemptionCount: { lt: coupon.maxRedemptions } },
    data: { redemptionCount: { increment: 1 } },
  });
  if (claimed.count === 0) {
    console.error(
      `Coupon ${couponId} redemption count already at its limit — a concurrent checkout raced past it. The discount was still honored for this already-captured payment.`
    );
  }
}
