import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../test/prismaMock";
import { settleJobBoost } from "@/lib/jobBoost";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("settleJobBoost", () => {
  it("sets featuredUntil to now + durationDays for a job with no active boost", async () => {
    prismaMock.jobBoost.findUnique.mockResolvedValue({
      id: "boost-1",
      jobId: "job-1",
      durationDays: 30,
    } as never);
    prismaMock.jobBoost.updateMany.mockResolvedValue({ count: 1 } as never);
    prismaMock.job.findUnique.mockResolvedValue({ featuredUntil: null } as never);
    prismaMock.jobBoost.findUniqueOrThrow.mockResolvedValue({ id: "boost-1" } as never);

    await settleJobBoost("boost-1", "pay_1");

    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: { featuredUntil: new Date("2026-01-31T00:00:00Z") },
    });
  });

  it("stacks onto the existing featuredUntil rather than resetting to now", async () => {
    prismaMock.jobBoost.findUnique.mockResolvedValue({
      id: "boost-2",
      jobId: "job-1",
      durationDays: 30,
    } as never);
    prismaMock.jobBoost.updateMany.mockResolvedValue({ count: 1 } as never);
    // Already featured 10 days into the future — the new boost should
    // extend from that point, not from "now".
    prismaMock.job.findUnique.mockResolvedValue({
      featuredUntil: new Date("2026-01-11T00:00:00Z"),
    } as never);
    prismaMock.jobBoost.findUniqueOrThrow.mockResolvedValue({ id: "boost-2" } as never);

    await settleJobBoost("boost-2", "pay_2");

    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: { featuredUntil: new Date("2026-02-10T00:00:00Z") },
    });
  });

  it("does not extend the window again for an already-settled boost", async () => {
    prismaMock.jobBoost.findUnique.mockResolvedValue({
      id: "boost-3",
      jobId: "job-1",
      durationDays: 30,
    } as never);
    prismaMock.jobBoost.updateMany.mockResolvedValue({ count: 0 } as never);
    prismaMock.jobBoost.findUniqueOrThrow.mockResolvedValue({ id: "boost-3" } as never);

    await settleJobBoost("boost-3", "pay_3");

    expect(prismaMock.job.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.job.update).not.toHaveBeenCalled();
  });
});
