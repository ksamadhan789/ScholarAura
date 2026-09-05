import { describe, expect, it } from "vitest";
import { prismaMock } from "../test/prismaMock";
import {
  computeCreditApplication,
  getReferralRatePercent,
  settleReferralCredit,
  InsufficientCreditError,
  DEFAULT_REFERRAL_RATE_PERCENT,
} from "@/lib/referral";
import type { User } from "@prisma/client";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "Test User",
    email: "user@example.com",
    passwordHash: null,
    googleId: null,
    role: "STUDENT",
    phone: null,
    organization: null,
    firstName: null,
    middleName: null,
    lastName: null,
    userType: null,
    fieldOfStudy: null,
    jobRole: null,
    expertise: null,
    onboardingCompletedAt: null,
    consentAcceptedAt: null,
    marketingOptIn: false,
    emailVerified: false,
    publicProfileEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    referralCode: null,
    referredById: null,
    creditBalance: 0 as unknown as User["creditBalance"],
    isAffiliate: false,
    affiliateRatePercent: null,
    ...overrides,
  } as User;
}

describe("getReferralRatePercent", () => {
  it("uses the default rate for a non-affiliate", () => {
    expect(getReferralRatePercent({ isAffiliate: false, affiliateRatePercent: null })).toBe(
      DEFAULT_REFERRAL_RATE_PERCENT
    );
  });

  it("uses the default rate for an affiliate with no custom rate set", () => {
    expect(getReferralRatePercent({ isAffiliate: true, affiliateRatePercent: null })).toBe(
      DEFAULT_REFERRAL_RATE_PERCENT
    );
  });

  it("uses the affiliate's custom rate when set", () => {
    expect(getReferralRatePercent({ isAffiliate: true, affiliateRatePercent: 25 })).toBe(25);
  });
});

describe("computeCreditApplication", () => {
  it("applies the full price as credit when the balance covers it", async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      makeUser({ creditBalance: 500 as unknown as User["creditBalance"] })
    );
    await expect(computeCreditApplication("user-1", 300)).resolves.toEqual({
      creditApplied: 300,
      amountDue: 0,
    });
  });

  it("applies only the available balance, leaving the rest due", async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      makeUser({ creditBalance: 100 as unknown as User["creditBalance"] })
    );
    await expect(computeCreditApplication("user-1", 300)).resolves.toEqual({
      creditApplied: 100,
      amountDue: 200,
    });
  });

  it("applies nothing when the user has no credit", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(computeCreditApplication("user-1", 300)).resolves.toEqual({
      creditApplied: 0,
      amountDue: 300,
    });
  });
});

describe("settleReferralCredit", () => {
  it("does nothing when the buyer doesn't exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await settleReferralCredit(prismaMock, {
      buyerId: "user-1",
      originalAmount: 1000,
      creditApplied: 0,
      description: "Course: Test",
    });
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  it("deducts applied credit and records a transaction", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(
      makeUser({ id: "buyer-1", creditBalance: 500 as unknown as User["creditBalance"] })
    );
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });

    await settleReferralCredit(prismaMock, {
      buyerId: "buyer-1",
      originalAmount: 1000,
      creditApplied: 200,
      description: "Course: Test",
    });

    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { id: "buyer-1", creditBalance: { gte: 200 } },
      data: { creditBalance: { decrement: 200 } },
    });
    expect(prismaMock.creditTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "buyer-1", amount: 200, type: "REDEEMED" }),
      })
    );
  });

  it("throws InsufficientCreditError when the guarded deduction claims nothing", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser({ id: "buyer-1" }));
    prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      settleReferralCredit(prismaMock, {
        buyerId: "buyer-1",
        originalAmount: 1000,
        creditApplied: 200,
        description: "Course: Test",
      })
    ).rejects.toThrow(InsufficientCreditError);
  });

  it("pays the referrer a reward at their configured rate", async () => {
    const buyer = makeUser({ id: "buyer-1", referredById: "referrer-1" });
    const referrer = makeUser({ id: "referrer-1", isAffiliate: true, affiliateRatePercent: 10 });

    prismaMock.user.findUnique.mockResolvedValueOnce(buyer).mockResolvedValueOnce(referrer);

    await settleReferralCredit(prismaMock, {
      buyerId: "buyer-1",
      originalAmount: 1000,
      creditApplied: 0,
      description: "Course: Test",
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "referrer-1" },
      data: { creditBalance: { increment: 100 } },
    });
    expect(prismaMock.creditTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "referrer-1", amount: 100, type: "EARNED" }),
      })
    );
  });

  it("bases the reward on cash actually paid, not the sticker price, when credit covers part of it", async () => {
    const buyer = makeUser({ id: "buyer-1", referredById: "referrer-1", creditBalance: 400 as unknown as User["creditBalance"] });
    const referrer = makeUser({ id: "referrer-1", isAffiliate: true, affiliateRatePercent: 10 });

    prismaMock.user.findUnique.mockResolvedValueOnce(buyer).mockResolvedValueOnce(referrer);
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });

    await settleReferralCredit(prismaMock, {
      buyerId: "buyer-1",
      originalAmount: 1000,
      creditApplied: 400,
      description: "Course: Test",
    });

    // 10% of the 600 actually paid in cash, not 10% of the 1000 sticker price.
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "referrer-1" },
      data: { creditBalance: { increment: 60 } },
    });
  });

  it("pays no reward when credit fully covers the purchase — no cash changed hands", async () => {
    const buyer = makeUser({ id: "buyer-1", referredById: "referrer-1", creditBalance: 1000 as unknown as User["creditBalance"] });
    const referrer = makeUser({ id: "referrer-1", isAffiliate: true, affiliateRatePercent: 10 });

    prismaMock.user.findUnique.mockResolvedValueOnce(buyer).mockResolvedValueOnce(referrer);
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });

    await settleReferralCredit(prismaMock, {
      buyerId: "buyer-1",
      originalAmount: 1000,
      creditApplied: 1000,
      description: "Course: Test",
    });

    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(prismaMock.creditTransaction.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "referrer-1" }) })
    );
  });

  it("pays no reward when the buyer has no referrer", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser({ id: "buyer-1", referredById: null }));

    await settleReferralCredit(prismaMock, {
      buyerId: "buyer-1",
      originalAmount: 1000,
      creditApplied: 0,
      description: "Course: Test",
    });

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
