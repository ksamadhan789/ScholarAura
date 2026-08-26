import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../test/prismaMock";
import {
  settleCoursePurchase,
  settleEventRegistration,
  settleCompetitionEntry,
  EventFullError,
} from "@/lib/paymentSettlement";

vi.mock("@/lib/email", () => ({
  sendEventRegistrationConfirmationEmail: vi.fn().mockResolvedValue(true),
  sendCompetitionEntryConfirmationEmail: vi.fn().mockResolvedValue(true),
}));

import { sendEventRegistrationConfirmationEmail, sendCompetitionEntryConfirmationEmail } from "@/lib/email";

beforeEach(() => {
  vi.mocked(sendEventRegistrationConfirmationEmail).mockClear();
  vi.mocked(sendCompetitionEntryConfirmationEmail).mockClear();
});

describe("settleCoursePurchase", () => {
  it("returns null when the purchase doesn't exist", async () => {
    prismaMock.coursePurchase.findUnique.mockResolvedValue(null);
    await expect(settleCoursePurchase("missing", "pay_1")).resolves.toBeNull();
  });

  it("marks a pending purchase SUCCESS and settles referral credit on fresh settlement", async () => {
    prismaMock.coursePurchase.findUnique.mockResolvedValue({
      id: "p1",
      userId: "buyer-1",
      courseId: "course-1",
      couponId: "coupon-1",
      amount: 1000,
      creditApplied: 0,
      status: "PENDING",
    } as never);
    prismaMock.course.findUnique.mockResolvedValue({ id: "course-1", title: "Test Course" } as never);
    prismaMock.coursePurchase.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.user.findUnique.mockResolvedValue({ id: "buyer-1", referredById: null } as never);
    prismaMock.coursePurchase.findUniqueOrThrow.mockResolvedValue({ id: "p1", status: "SUCCESS" } as never);

    await settleCoursePurchase("p1", "pay_1");

    expect(prismaMock.coursePurchase.updateMany).toHaveBeenCalledWith({
      where: { id: "p1", status: { not: "SUCCESS" } },
      data: { status: "SUCCESS", razorpayPaymentId: "pay_1" },
    });
    expect(prismaMock.coupon.update).toHaveBeenCalledWith({
      where: { id: "coupon-1" },
      data: { redemptionCount: { increment: 1 } },
    });
  });

  it("does not re-settle referral credit or bump the coupon on a duplicate call", async () => {
    prismaMock.coursePurchase.findUnique.mockResolvedValue({
      id: "p1",
      userId: "buyer-1",
      courseId: "course-1",
      couponId: "coupon-1",
      amount: 1000,
      creditApplied: 0,
      status: "SUCCESS",
    } as never);
    prismaMock.course.findUnique.mockResolvedValue({ id: "course-1", title: "Test Course" } as never);
    // Guarded updateMany claims nothing — this purchase was already settled by
    // an earlier call (e.g. the browser confirmation racing the webhook).
    prismaMock.coursePurchase.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.coursePurchase.findUniqueOrThrow.mockResolvedValue({ id: "p1", status: "SUCCESS" } as never);

    await settleCoursePurchase("p1", "pay_1");

    expect(prismaMock.coupon.update).not.toHaveBeenCalled();
    expect(prismaMock.creditTransaction.create).not.toHaveBeenCalled();
  });
});

describe("settleEventRegistration", () => {
  const event = {
    id: "event-1",
    title: "Test Event",
    seatsTotal: 10,
    seatsFilled: 5,
    startDate: new Date(),
    venueOrLink: "https://example.com",
  };

  it("confirms a pending registration, claims a seat, and sends a confirmation email on fresh settlement", async () => {
    prismaMock.eventRegistration.findUnique.mockResolvedValue({
      id: "r1",
      userId: "buyer-1",
      eventId: "event-1",
      couponId: null,
      amount: 500,
      creditApplied: 0,
      status: "PENDING",
      enrollmentNumber: "EVT-2026-000001",
      user: { email: "buyer@example.com", name: "Buyer" },
    } as never);
    prismaMock.event.findUnique.mockResolvedValue(event as never);
    prismaMock.eventRegistration.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.event.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.user.findUnique.mockResolvedValue({ id: "buyer-1", referredById: null } as never);
    prismaMock.eventRegistration.findUniqueOrThrow.mockResolvedValue({
      id: "r1",
      status: "CONFIRMED",
      enrollmentNumber: "EVT-2026-000001",
    } as never);

    await settleEventRegistration("r1", "pay_1");

    expect(prismaMock.event.updateMany).toHaveBeenCalledWith({
      where: { id: "event-1", seatsFilled: { lt: 10 } },
      data: { seatsFilled: { increment: 1 } },
    });
    expect(sendEventRegistrationConfirmationEmail).toHaveBeenCalledWith(
      "buyer@example.com",
      "Buyer",
      "Test Event",
      event.startDate,
      event.venueOrLink,
      "EVT-2026-000001"
    );
  });

  it("throws EventFullError when the event filled up between checkout and payment capture", async () => {
    prismaMock.eventRegistration.findUnique.mockResolvedValue({
      id: "r1",
      userId: "buyer-1",
      eventId: "event-1",
      couponId: null,
      amount: 500,
      creditApplied: 0,
      status: "PENDING",
      enrollmentNumber: "EVT-2026-000001",
      user: { email: "buyer@example.com", name: "Buyer" },
    } as never);
    prismaMock.event.findUnique.mockResolvedValue(event as never);
    prismaMock.eventRegistration.updateMany.mockResolvedValue({ count: 1 });
    // No seats left by the time payment was captured.
    prismaMock.event.updateMany.mockResolvedValue({ count: 0 });

    await expect(settleEventRegistration("r1", "pay_1")).rejects.toThrow(EventFullError);
    expect(sendEventRegistrationConfirmationEmail).not.toHaveBeenCalled();
  });

  it("does not re-claim a seat or resend the email on a duplicate call", async () => {
    prismaMock.eventRegistration.findUnique.mockResolvedValue({
      id: "r1",
      userId: "buyer-1",
      eventId: "event-1",
      couponId: null,
      amount: 500,
      creditApplied: 0,
      status: "CONFIRMED",
      enrollmentNumber: "EVT-2026-000001",
      user: { email: "buyer@example.com", name: "Buyer" },
    } as never);
    prismaMock.event.findUnique.mockResolvedValue(event as never);
    prismaMock.eventRegistration.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.eventRegistration.findUniqueOrThrow.mockResolvedValue({
      id: "r1",
      status: "CONFIRMED",
      enrollmentNumber: "EVT-2026-000001",
    } as never);

    await settleEventRegistration("r1", "pay_1");

    expect(prismaMock.event.updateMany).not.toHaveBeenCalled();
    expect(sendEventRegistrationConfirmationEmail).not.toHaveBeenCalled();
  });
});

describe("settleCompetitionEntry", () => {
  it("marks a pending entry SUCCESS and sends a confirmation email on fresh settlement", async () => {
    prismaMock.competitionEntry.findUnique.mockResolvedValue({
      id: "e1",
      userId: "buyer-1",
      competitionId: "comp-1",
      couponId: null,
      amount: 300,
      creditApplied: 0,
      status: "PENDING",
      enrollmentNumber: "CENR-2026-000001",
      user: { email: "buyer@example.com", name: "Buyer" },
    } as never);
    prismaMock.competition.findUnique.mockResolvedValue({
      id: "comp-1",
      title: "Test Competition",
      submissionDeadline: new Date(),
    } as never);
    prismaMock.competitionEntry.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.user.findUnique.mockResolvedValue({ id: "buyer-1", referredById: null } as never);
    prismaMock.competitionEntry.findUniqueOrThrow.mockResolvedValue({
      id: "e1",
      status: "SUCCESS",
      enrollmentNumber: "CENR-2026-000001",
    } as never);

    await settleCompetitionEntry("e1", "pay_1");

    expect(sendCompetitionEntryConfirmationEmail).toHaveBeenCalledWith(
      "buyer@example.com",
      "Buyer",
      "Test Competition",
      expect.any(Date),
      "CENR-2026-000001"
    );
  });

  it("does not resettle or resend the email on a duplicate call", async () => {
    prismaMock.competitionEntry.findUnique.mockResolvedValue({
      id: "e1",
      userId: "buyer-1",
      competitionId: "comp-1",
      couponId: "coupon-1",
      amount: 300,
      creditApplied: 0,
      status: "SUCCESS",
      enrollmentNumber: "CENR-2026-000001",
      user: { email: "buyer@example.com", name: "Buyer" },
    } as never);
    prismaMock.competition.findUnique.mockResolvedValue({
      id: "comp-1",
      title: "Test Competition",
      submissionDeadline: new Date(),
    } as never);
    prismaMock.competitionEntry.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.competitionEntry.findUniqueOrThrow.mockResolvedValue({
      id: "e1",
      status: "SUCCESS",
      enrollmentNumber: "CENR-2026-000001",
    } as never);

    await settleCompetitionEntry("e1", "pay_1");

    expect(prismaMock.coupon.update).not.toHaveBeenCalled();
    expect(sendCompetitionEntryConfirmationEmail).not.toHaveBeenCalled();
  });
});
