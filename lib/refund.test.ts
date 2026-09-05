import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../test/prismaMock";
import {
  refundCoursePurchase,
  refundEventRegistration,
  refundCompetitionEntry,
  AlreadyRefundedError,
  NotRefundableError,
} from "@/lib/refund";
import type { CoursePurchase, EventRegistration, CompetitionEntry, User } from "@prisma/client";

vi.mock("@/lib/razorpay", () => ({
  createRefund: vi.fn().mockResolvedValue({ id: "rfnd_1", status: "processed" }),
}));
vi.mock("@/lib/waitlist", () => ({
  notifyNextWaitlisted: vi.fn().mockResolvedValue(undefined),
}));

// prismaMock is reset per-test by test/prismaMock.ts, but mocks from vi.mock()
// above (createRefund, notifyNextWaitlisted) keep their call history across
// tests unless cleared here.
beforeEach(() => {
  vi.clearAllMocks();
});

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "buyer-1",
    name: "Buyer",
    email: "buyer@example.com",
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

describe("refundCoursePurchase", () => {
  it("throws AlreadyRefundedError for an already-refunded purchase", async () => {
    prismaMock.coursePurchase.findUnique.mockResolvedValue({
      id: "p1",
      status: "REFUNDED",
      course: { title: "Course" },
    } as never);

    await expect(refundCoursePurchase("p1")).rejects.toThrow(AlreadyRefundedError);
  });

  it("throws NotRefundableError for a purchase that never succeeded", async () => {
    prismaMock.coursePurchase.findUnique.mockResolvedValue({
      id: "p1",
      status: "PENDING",
      course: { title: "Course" },
    } as never);

    await expect(refundCoursePurchase("p1")).rejects.toThrow(NotRefundableError);
  });

  it("restores applied credit and marks the purchase REFUNDED", async () => {
    const purchase = {
      id: "p1",
      userId: "buyer-1",
      status: "SUCCESS",
      amount: 1000 as unknown as CoursePurchase["amount"],
      creditApplied: 200 as unknown as CoursePurchase["creditApplied"],
      razorpayPaymentId: "pay_1",
      course: { title: "Test Course" },
    };
    prismaMock.coursePurchase.findUnique.mockResolvedValue(purchase as never);
    prismaMock.coursePurchase.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.coursePurchase.findUniqueOrThrow.mockResolvedValue({
      ...purchase,
      status: "REFUNDED",
    } as never);
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser({ referredById: null }));

    await refundCoursePurchase("p1");

    expect(prismaMock.coursePurchase.updateMany).toHaveBeenCalledWith({
      where: { id: "p1", status: "SUCCESS" },
      data: { status: "REFUNDED" },
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "buyer-1" },
      data: { creditBalance: { increment: 200 } },
    });
    expect(prismaMock.creditTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "buyer-1", amount: 200, type: "EARNED" }) })
    );
  });

  it("revokes an issued certificate for the refunded course", async () => {
    const purchase = {
      id: "p1",
      userId: "buyer-1",
      courseId: "course-1",
      status: "SUCCESS",
      amount: 1000 as unknown as CoursePurchase["amount"],
      creditApplied: 0 as unknown as CoursePurchase["creditApplied"],
      razorpayPaymentId: null,
      course: { title: "Test Course" },
    };
    prismaMock.coursePurchase.findUnique.mockResolvedValue(purchase as never);
    prismaMock.coursePurchase.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.coursePurchase.findUniqueOrThrow.mockResolvedValue({
      ...purchase,
      status: "REFUNDED",
    } as never);
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser({ referredById: null }));

    await refundCoursePurchase("p1");

    expect(prismaMock.certificate.updateMany).toHaveBeenCalledWith({
      where: { userId: "buyer-1", courseId: "course-1", status: { not: "REVOKED" } },
      data: { status: "REVOKED", revokedAt: expect.any(Date), revokedReason: "Refunded" },
    });
  });

  it("claws back the referrer's reward when their balance covers it", async () => {
    const purchase = {
      id: "p1",
      userId: "buyer-1",
      status: "SUCCESS",
      amount: 1000 as unknown as CoursePurchase["amount"],
      creditApplied: 0 as unknown as CoursePurchase["creditApplied"],
      razorpayPaymentId: null,
      course: { title: "Test Course" },
    };
    prismaMock.coursePurchase.findUnique.mockResolvedValue(purchase as never);
    prismaMock.coursePurchase.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.coursePurchase.findUniqueOrThrow.mockResolvedValue({ ...purchase, status: "REFUNDED" } as never);
    prismaMock.user.findUnique
      .mockResolvedValueOnce(makeUser({ id: "buyer-1", referredById: "referrer-1" }))
      .mockResolvedValueOnce(makeUser({ id: "referrer-1" }));
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });

    await refundCoursePurchase("p1");

    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { id: "referrer-1", creditBalance: { gte: 100 } },
      data: { creditBalance: { decrement: 100 } },
    });
    expect(prismaMock.creditTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "referrer-1", type: "REDEEMED" }),
      })
    );
  });

  it("claws back the reward based on cash paid, not the sticker price, when credit covered part of the purchase", async () => {
    const purchase = {
      id: "p1",
      userId: "buyer-1",
      status: "SUCCESS",
      amount: 1000 as unknown as CoursePurchase["amount"],
      creditApplied: 400 as unknown as CoursePurchase["creditApplied"],
      razorpayPaymentId: null,
      course: { title: "Test Course" },
    };
    prismaMock.coursePurchase.findUnique.mockResolvedValue(purchase as never);
    prismaMock.coursePurchase.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.coursePurchase.findUniqueOrThrow.mockResolvedValue({ ...purchase, status: "REFUNDED" } as never);
    prismaMock.user.findUnique
      .mockResolvedValueOnce(makeUser({ id: "buyer-1", referredById: "referrer-1" }))
      .mockResolvedValueOnce(makeUser({ id: "referrer-1" }));
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });

    await refundCoursePurchase("p1");

    // 10% of the 600 actually paid in cash (1000 - 400 credit), not 10% of 1000.
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { id: "referrer-1", creditBalance: { gte: 60 } },
      data: { creditBalance: { decrement: 60 } },
    });
  });

  it("skips the clawback without throwing when the referrer already spent the reward", async () => {
    const purchase = {
      id: "p1",
      userId: "buyer-1",
      status: "SUCCESS",
      amount: 1000 as unknown as CoursePurchase["amount"],
      creditApplied: 0 as unknown as CoursePurchase["creditApplied"],
      razorpayPaymentId: null,
      course: { title: "Test Course" },
    };
    prismaMock.coursePurchase.findUnique.mockResolvedValue(purchase as never);
    prismaMock.coursePurchase.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.coursePurchase.findUniqueOrThrow.mockResolvedValue({ ...purchase, status: "REFUNDED" } as never);
    prismaMock.user.findUnique
      .mockResolvedValueOnce(makeUser({ id: "buyer-1", referredById: "referrer-1" }))
      .mockResolvedValueOnce(makeUser({ id: "referrer-1" }));
    prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(refundCoursePurchase("p1")).resolves.toBeDefined();
    // No REDEEMED clawback transaction should be recorded since the guard claimed nothing.
    expect(prismaMock.creditTransaction.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "REDEEMED" }) })
    );
  });

  it("throws AlreadyRefundedError instead of double-refunding when another caller wins the race", async () => {
    const purchase = {
      id: "p1",
      userId: "buyer-1",
      status: "SUCCESS",
      amount: 1000 as unknown as CoursePurchase["amount"],
      creditApplied: 0 as unknown as CoursePurchase["creditApplied"],
      razorpayPaymentId: "pay_1",
      course: { title: "Test Course" },
    };
    prismaMock.coursePurchase.findUnique.mockResolvedValue(purchase as never);
    // Both callers read status SUCCESS, but only one's atomic claim actually flips the row.
    prismaMock.coursePurchase.updateMany.mockResolvedValue({ count: 0 });

    const { createRefund } = await import("@/lib/razorpay");

    await expect(refundCoursePurchase("p1")).rejects.toThrow(AlreadyRefundedError);
    expect(createRefund).not.toHaveBeenCalled();
  });

  it("releases the claim so the purchase can be retried when the Razorpay refund fails", async () => {
    const purchase = {
      id: "p1",
      userId: "buyer-1",
      status: "SUCCESS",
      amount: 1000 as unknown as CoursePurchase["amount"],
      creditApplied: 0 as unknown as CoursePurchase["creditApplied"],
      razorpayPaymentId: "pay_1",
      course: { title: "Test Course" },
    };
    prismaMock.coursePurchase.findUnique.mockResolvedValue(purchase as never);
    prismaMock.coursePurchase.updateMany.mockResolvedValue({ count: 1 });

    const { createRefund } = await import("@/lib/razorpay");
    vi.mocked(createRefund).mockRejectedValueOnce(new Error("razorpay down"));

    await expect(refundCoursePurchase("p1")).rejects.toThrow("razorpay down");

    expect(prismaMock.coursePurchase.updateMany).toHaveBeenCalledWith({
      where: { id: "p1", status: "REFUNDED" },
      data: { status: "SUCCESS" },
    });
  });
});

describe("refundEventRegistration", () => {
  it("throws AlreadyRefundedError for an already-refunded registration", async () => {
    prismaMock.eventRegistration.findUnique.mockResolvedValue({
      id: "r1",
      status: "REFUNDED",
      event: { title: "Event" },
    } as never);

    await expect(refundEventRegistration("r1")).rejects.toThrow(AlreadyRefundedError);
  });

  it("throws NotRefundableError for a registration that isn't confirmed", async () => {
    prismaMock.eventRegistration.findUnique.mockResolvedValue({
      id: "r1",
      status: "CANCELLED",
      event: { title: "Event" },
    } as never);

    await expect(refundEventRegistration("r1")).rejects.toThrow(NotRefundableError);
  });

  it("frees the seat and marks the registration REFUNDED", async () => {
    const registration = {
      id: "r1",
      userId: "buyer-1",
      eventId: "event-1",
      status: "CONFIRMED",
      amount: 500 as unknown as EventRegistration["amount"],
      creditApplied: 0 as unknown as EventRegistration["creditApplied"],
      razorpayPaymentId: "pay_1",
      event: { title: "Test Event" },
    };
    prismaMock.eventRegistration.findUnique.mockResolvedValue(registration as never);
    prismaMock.eventRegistration.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.eventRegistration.findUniqueOrThrow.mockResolvedValue({
      ...registration,
      status: "REFUNDED",
    } as never);
    prismaMock.event.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser({ referredById: null }));

    await refundEventRegistration("r1");

    expect(prismaMock.event.updateMany).toHaveBeenCalledWith({
      where: { id: "event-1", seatsFilled: { gt: 0 } },
      data: { seatsFilled: { decrement: 1 } },
    });
    expect(prismaMock.eventRegistration.updateMany).toHaveBeenCalledWith({
      where: { id: "r1", status: "CONFIRMED" },
      data: { status: "REFUNDED" },
    });
    expect(prismaMock.certificate.updateMany).toHaveBeenCalledWith({
      where: { userId: "buyer-1", eventId: "event-1", status: { not: "REVOKED" } },
      data: { status: "REVOKED", revokedAt: expect.any(Date), revokedReason: "Refunded" },
    });
  });
});

describe("refundCompetitionEntry", () => {
  it("throws AlreadyRefundedError for an already-refunded entry", async () => {
    prismaMock.competitionEntry.findUnique.mockResolvedValue({
      id: "e1",
      status: "REFUNDED",
      competition: { title: "Comp" },
    } as never);

    await expect(refundCompetitionEntry("e1")).rejects.toThrow(AlreadyRefundedError);
  });

  it("marks a successful entry REFUNDED", async () => {
    const entry = {
      id: "e1",
      userId: "buyer-1",
      competitionId: "comp-1",
      status: "SUCCESS",
      amount: 300 as unknown as CompetitionEntry["amount"],
      creditApplied: 0 as unknown as CompetitionEntry["creditApplied"],
      razorpayPaymentId: null,
      competition: { title: "Test Competition" },
    };
    prismaMock.competitionEntry.findUnique.mockResolvedValue(entry as never);
    prismaMock.competitionEntry.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.competitionEntry.findUniqueOrThrow.mockResolvedValue({
      ...entry,
      status: "REFUNDED",
    } as never);
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser({ referredById: null }));

    await refundCompetitionEntry("e1");

    expect(prismaMock.competitionEntry.updateMany).toHaveBeenCalledWith({
      where: { id: "e1", status: "SUCCESS" },
      data: { status: "REFUNDED" },
    });
    expect(prismaMock.certificate.updateMany).toHaveBeenCalledWith({
      where: { userId: "buyer-1", competitionId: "comp-1", status: { not: "REVOKED" } },
      data: { status: "REVOKED", revokedAt: expect.any(Date), revokedReason: "Refunded" },
    });
  });
});
