import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../test/prismaMock";
import {
  createRefundRequest,
  approveRefundRequest,
  rejectRefundRequest,
  AlreadyRequestedError,
  NotEligibleError,
  RequestNotFoundError,
} from "@/lib/refundRequest";

vi.mock("@/lib/refund", () => ({
  refundCoursePurchase: vi.fn().mockResolvedValue(undefined),
  refundEventRegistration: vi.fn().mockResolvedValue(undefined),
  refundCompetitionEntry: vi.fn().mockResolvedValue(undefined),
  AlreadyRefundedError: class AlreadyRefundedError extends Error {},
  NotRefundableError: class NotRefundableError extends Error {},
}));

import { refundCoursePurchase } from "@/lib/refund";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createRefundRequest", () => {
  it("throws NotEligibleError for someone else's purchase", async () => {
    prismaMock.coursePurchase.findUnique.mockResolvedValue({
      id: "p1",
      userId: "other-user",
      status: "SUCCESS",
      amount: 500,
    } as never);

    await expect(
      createRefundRequest({ userId: "buyer-1", kind: "course", itemId: "p1", reason: "Not what I expected" })
    ).rejects.toThrow(NotEligibleError);
  });

  it("throws NotEligibleError for a free (zero-amount) purchase", async () => {
    prismaMock.coursePurchase.findUnique.mockResolvedValue({
      id: "p1",
      userId: "buyer-1",
      status: "SUCCESS",
      amount: 0,
    } as never);

    await expect(
      createRefundRequest({ userId: "buyer-1", kind: "course", itemId: "p1", reason: "Not what I expected" })
    ).rejects.toThrow(NotEligibleError);
  });

  it("throws AlreadyRequestedError when a pending request already exists", async () => {
    prismaMock.coursePurchase.findUnique.mockResolvedValue({
      id: "p1",
      userId: "buyer-1",
      status: "SUCCESS",
      amount: 500,
    } as never);
    prismaMock.refundRequest.findFirst.mockResolvedValue({ id: "existing" } as never);

    await expect(
      createRefundRequest({ userId: "buyer-1", kind: "course", itemId: "p1", reason: "Not what I expected" })
    ).rejects.toThrow(AlreadyRequestedError);
  });

  it("creates a pending request for an eligible course purchase", async () => {
    prismaMock.coursePurchase.findUnique.mockResolvedValue({
      id: "p1",
      userId: "buyer-1",
      status: "SUCCESS",
      amount: 500,
    } as never);
    prismaMock.refundRequest.findFirst.mockResolvedValue(null);
    prismaMock.refundRequest.create.mockResolvedValue({ id: "r1" } as never);

    await createRefundRequest({ userId: "buyer-1", kind: "course", itemId: "p1", reason: "Not what I expected" });

    expect(prismaMock.refundRequest.create).toHaveBeenCalledWith({
      data: { userId: "buyer-1", coursePurchaseId: "p1", reason: "Not what I expected" },
    });
  });
});

describe("approveRefundRequest / rejectRefundRequest", () => {
  function makeRequest(overrides: Record<string, unknown> = {}) {
    return {
      id: "req-1",
      userId: "buyer-1",
      status: "PENDING",
      coursePurchaseId: "p1",
      eventRegistrationId: null,
      competitionEntryId: null,
      user: { email: "buyer@example.com", name: "Buyer" },
      coursePurchase: { course: { title: "Test Course", slug: "test-course" } },
      eventRegistration: null,
      competitionEntry: null,
      ...overrides,
    };
  }

  it("throws RequestNotFoundError when the request doesn't exist", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue(null);
    await expect(approveRefundRequest("missing")).rejects.toThrow(RequestNotFoundError);
  });

  it("throws RequestNotFoundError when the request was already resolved", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue(makeRequest({ status: "APPROVED" }) as never);
    await expect(approveRefundRequest("req-1")).rejects.toThrow(RequestNotFoundError);
  });

  it("refunds the course purchase and marks the request APPROVED", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue(makeRequest() as never);

    const info = await approveRefundRequest("req-1");

    expect(refundCoursePurchase).toHaveBeenCalledWith("p1");
    expect(prismaMock.refundRequest.update).toHaveBeenCalledWith({
      where: { id: "req-1" },
      data: { status: "APPROVED", resolvedAt: expect.any(Date) },
    });
    expect(info).toEqual({
      userId: "buyer-1",
      userEmail: "buyer@example.com",
      userName: "Buyer",
      itemTitle: "Test Course",
      itemUrl: "/courses/test-course",
    });
  });

  it("marks the request REJECTED without touching the underlying purchase", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue(makeRequest() as never);

    await rejectRefundRequest("req-1", "Outside the refund window");

    expect(refundCoursePurchase).not.toHaveBeenCalled();
    expect(prismaMock.refundRequest.update).toHaveBeenCalledWith({
      where: { id: "req-1" },
      data: { status: "REJECTED", rejectionReason: "Outside the refund window", resolvedAt: expect.any(Date) },
    });
  });
});
