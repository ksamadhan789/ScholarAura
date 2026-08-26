import { describe, expect, it } from "vitest";
import { prismaMock } from "../test/prismaMock";
import { computeDiscount, findValidCoupon, hasUserRedeemedCoupon, CouponError } from "@/lib/coupon";
import type { Coupon } from "@prisma/client";

function makeCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: "coupon-1",
    code: "WELCOME20",
    discountType: "PERCENT",
    discountValue: 20 as unknown as Coupon["discountValue"],
    appliesTo: "ALL",
    maxRedemptions: null,
    redemptionCount: 0,
    minAmount: null,
    expiresAt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Coupon;
}

describe("computeDiscount", () => {
  it("computes a percent discount", () => {
    const coupon = makeCoupon({ discountType: "PERCENT", discountValue: 20 as unknown as Coupon["discountValue"] });
    expect(computeDiscount(coupon, 1000)).toBe(200);
  });

  it("computes a fixed discount", () => {
    const coupon = makeCoupon({ discountType: "FIXED", discountValue: 150 as unknown as Coupon["discountValue"] });
    expect(computeDiscount(coupon, 1000)).toBe(150);
  });

  it("never discounts more than the purchase amount", () => {
    const coupon = makeCoupon({ discountType: "FIXED", discountValue: 500 as unknown as Coupon["discountValue"] });
    expect(computeDiscount(coupon, 300)).toBe(300);
  });

  it("rounds to two decimal places", () => {
    const coupon = makeCoupon({ discountType: "PERCENT", discountValue: (100 / 3) as unknown as Coupon["discountValue"] });
    expect(computeDiscount(coupon, 100)).toBe(33.33);
  });
});

describe("findValidCoupon", () => {
  it("rejects an unknown code", async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(null);
    await expect(findValidCoupon("NOPE", "EVENT", 1000)).rejects.toThrow(CouponError);
  });

  it("rejects an inactive coupon", async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(makeCoupon({ isActive: false }));
    await expect(findValidCoupon("WELCOME20", "EVENT", 1000)).rejects.toThrow(CouponError);
  });

  it("rejects a coupon scoped to a different purchase type", async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(makeCoupon({ appliesTo: "COURSE" }));
    await expect(findValidCoupon("WELCOME20", "EVENT", 1000)).rejects.toThrow(
      "doesn't apply to this purchase"
    );
  });

  it("allows an ALL-scoped coupon regardless of purchase type", async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(makeCoupon({ appliesTo: "ALL" }));
    await expect(findValidCoupon("WELCOME20", "COMPETITION", 1000)).resolves.toMatchObject({ code: "WELCOME20" });
  });

  it("rejects an expired coupon", async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(
      makeCoupon({ expiresAt: new Date(Date.now() - 86400000) })
    );
    await expect(findValidCoupon("WELCOME20", "EVENT", 1000)).rejects.toThrow("expired");
  });

  it("rejects a coupon that has reached its redemption limit", async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(
      makeCoupon({ maxRedemptions: 10, redemptionCount: 10 })
    );
    await expect(findValidCoupon("WELCOME20", "EVENT", 1000)).rejects.toThrow("redemption limit");
  });

  it("rejects a purchase below the coupon's minimum amount", async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(
      makeCoupon({ minAmount: 500 as unknown as Coupon["minAmount"] })
    );
    await expect(findValidCoupon("WELCOME20", "EVENT", 100)).rejects.toThrow("minimum amount");
  });

  it("returns the coupon when every rule passes", async () => {
    const coupon = makeCoupon({ minAmount: 500 as unknown as Coupon["minAmount"] });
    prismaMock.coupon.findUnique.mockResolvedValue(coupon);
    await expect(findValidCoupon("WELCOME20", "EVENT", 1000)).resolves.toEqual(coupon);
  });

  it("normalizes the code to uppercase and trimmed before lookup", async () => {
    prismaMock.coupon.findUnique.mockResolvedValue(makeCoupon());
    await findValidCoupon("  welcome20  ", "EVENT", 1000);
    expect(prismaMock.coupon.findUnique).toHaveBeenCalledWith({ where: { code: "WELCOME20" } });
  });
});

describe("hasUserRedeemedCoupon", () => {
  it("returns false when no purchase table has a matching redemption", async () => {
    prismaMock.coursePurchase.findFirst.mockResolvedValue(null);
    prismaMock.eventRegistration.findFirst.mockResolvedValue(null);
    prismaMock.competitionEntry.findFirst.mockResolvedValue(null);
    await expect(hasUserRedeemedCoupon("user-1", "coupon-1")).resolves.toBe(false);
  });

  it("returns true when the coupon was already used on a course purchase", async () => {
    prismaMock.coursePurchase.findFirst.mockResolvedValue({ id: "purchase-1" } as never);
    prismaMock.eventRegistration.findFirst.mockResolvedValue(null);
    prismaMock.competitionEntry.findFirst.mockResolvedValue(null);
    await expect(hasUserRedeemedCoupon("user-1", "coupon-1")).resolves.toBe(true);
  });

  it("returns true when the coupon was already used on an event registration", async () => {
    prismaMock.coursePurchase.findFirst.mockResolvedValue(null);
    prismaMock.eventRegistration.findFirst.mockResolvedValue({ id: "reg-1" } as never);
    prismaMock.competitionEntry.findFirst.mockResolvedValue(null);
    await expect(hasUserRedeemedCoupon("user-1", "coupon-1")).resolves.toBe(true);
  });
});
