import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../test/prismaMock";
import { logAdminAction } from "@/lib/auditLog";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("logAdminAction", () => {
  it("records an audit log entry with the given fields", async () => {
    await logAdminAction({
      actorId: "admin-1",
      action: "REFUND_ISSUED",
      targetType: "CoursePurchase",
      targetId: "purchase-1",
      metadata: { amount: 999 },
    });

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: "admin-1",
        action: "REFUND_ISSUED",
        targetType: "CoursePurchase",
        targetId: "purchase-1",
        metadata: { amount: 999 },
      },
    });
  });

  it("swallows a write failure instead of throwing", async () => {
    prismaMock.auditLog.create.mockRejectedValueOnce(new Error("db down"));

    await expect(
      logAdminAction({
        actorId: "admin-1",
        action: "JOB_APPROVED",
        targetType: "Job",
        targetId: "job-1",
      })
    ).resolves.toBeUndefined();
  });
});
