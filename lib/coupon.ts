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
 * Thrown at settlement when a coupon can no longer be honored — its
 * redemption limit was reached, or this person already used it on another
 * purchase — typically because several checkouts using the same code were
 * opened at once (each passed the checkout-time checks before any settled).
 * The payment settlement turns this into an automatic refund.
 */
export class CouponUnavailableError extends CouponError {
  constructor() {
    super("This coupon was already used up by another purchase. Please check out again.");
  }
}

/** Who is redeeming, and which item this purchase is for (excluded from the one-per-person check). */
export type CouponRedeemer = {
  userId: string;
  courseId?: string;
  eventId?: string;
  competitionId?: string;
};

/**
 * Records a redemption at settlement time — the only point a purchase is
 * known to have actually succeeded — and enforces the redemption limit and
 * "once per person" rule there, atomically. The checkout-time checks
 * (findValidCoupon, hasUserRedeemedCoupon) can't: two checkouts opened at
 * once both pass them before either settles. The coupon row is updated
 * first, which locks it until this transaction commits, so concurrent
 * settlements of the same coupon run one after another and the per-person
 * check below sees the other's committed purchase. Throws
 * CouponUnavailableError (rolling the settlement back) when the coupon
 * can't be honored.
 */
export async function claimCouponRedemption(
  tx: Prisma.TransactionClient,
  couponId: string | null,
  redeemer: CouponRedeemer
): Promise<void> {
  if (!couponId) return;

  const coupon = await tx.coupon.findUnique({ where: { id: couponId }, select: { maxRedemptions: true } });
  if (!coupon) return;

  const claimed = await tx.coupon.updateMany({
    where: {
      id: couponId,
      ...(coupon.maxRedemptions != null && { redemptionCount: { lt: coupon.maxRedemptions } }),
    },
    data: { redemptionCount: { increment: 1 } },
  });
  if (claimed.count === 0) throw new CouponUnavailableError();

  const { userId, courseId, eventId, competitionId } = redeemer;
  const [course, event, competition] = await Promise.all([
    tx.coursePurchase.findFirst({
      where: { userId, couponId, status: "SUCCESS", ...(courseId && { courseId: { not: courseId } }) },
    }),
    tx.eventRegistration.findFirst({
      where: { userId, couponId, status: { in: ["CONFIRMED", "ATTENDED"] }, ...(eventId && { eventId: { not: eventId } }) },
    }),
    tx.competitionEntry.findFirst({
      where: { userId, couponId, status: "SUCCESS", ...(competitionId && { competitionId: { not: competitionId } }) },
    }),
  ]);
  if (course || event || competition) throw new CouponUnavailableError();
}
