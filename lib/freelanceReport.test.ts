import { describe, expect, it } from "vitest";
import { prismaMock } from "../test/prismaMock";
import {
  createFreelanceReport,
  dismissFreelanceReport,
  removeFreelanceListing,
  restoreFreelanceListing,
  ListingNotFoundError,
  ReportNotFoundError,
} from "@/lib/freelanceReport";
import { isFreelanceReportReason } from "@/lib/freelanceReportReasons";

const params = { listingId: "listing-1", reporterId: "user-1", reason: "SCAM" as const, details: null };

describe("createFreelanceReport", () => {
  it("creates a new report when the person has no open one", async () => {
    prismaMock.freelanceReport.findFirst.mockResolvedValue(null);
    prismaMock.freelanceReport.create.mockResolvedValue({ id: "r1" } as never);

    const result = await createFreelanceReport(params);
    expect(result.created).toBe(true);
    expect(prismaMock.freelanceReport.create).toHaveBeenCalled();
  });

  it("updates the existing open report instead of adding a duplicate", async () => {
    prismaMock.freelanceReport.findFirst.mockResolvedValue({ id: "r1" } as never);
    prismaMock.freelanceReport.update.mockResolvedValue({ id: "r1" } as never);

    const result = await createFreelanceReport({ ...params, reason: "SPAM", details: "more info" });
    expect(result.created).toBe(false);
    expect(prismaMock.freelanceReport.create).not.toHaveBeenCalled();
    expect(prismaMock.freelanceReport.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { reason: "SPAM", details: "more info" },
    });
  });
});

describe("dismissFreelanceReport", () => {
  it("rejects a report that's already been handled", async () => {
    prismaMock.freelanceReport.findUnique.mockResolvedValue({ id: "r1", status: "DISMISSED" } as never);
    await expect(dismissFreelanceReport("r1")).rejects.toBeInstanceOf(ReportNotFoundError);
  });

  it("marks an open report dismissed", async () => {
    prismaMock.freelanceReport.findUnique.mockResolvedValue({ id: "r1", status: "OPEN" } as never);
    prismaMock.freelanceReport.update.mockResolvedValue({ id: "r1" } as never);

    await dismissFreelanceReport("r1");
    expect(prismaMock.freelanceReport.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "DISMISSED" }) })
    );
  });
});

describe("removeFreelanceListing", () => {
  it("unpublishes, flags as removed, and closes every open report on the listing", async () => {
    prismaMock.freelanceListing.findUnique.mockResolvedValue({ id: "listing-1" } as never);

    await removeFreelanceListing("listing-1");
    expect(prismaMock.freelanceListing.update).toHaveBeenCalledWith({
      where: { id: "listing-1" },
      data: { isPublished: false, removedByAdminAt: expect.any(Date) },
    });
    expect(prismaMock.freelanceReport.updateMany).toHaveBeenCalledWith({
      where: { listingId: "listing-1", status: "OPEN" },
      data: { status: "ACTIONED", resolvedAt: expect.any(Date) },
    });
  });

  it("throws for a listing that no longer exists", async () => {
    prismaMock.freelanceListing.findUnique.mockResolvedValue(null);
    await expect(removeFreelanceListing("gone")).rejects.toBeInstanceOf(ListingNotFoundError);
  });
});

describe("restoreFreelanceListing", () => {
  it("only restores a listing that was actually removed", async () => {
    prismaMock.freelanceListing.findUnique.mockResolvedValue({ id: "listing-1", removedByAdminAt: null } as never);
    await expect(restoreFreelanceListing("listing-1")).rejects.toBeInstanceOf(ListingNotFoundError);
  });
});

describe("isFreelanceReportReason", () => {
  it("accepts only the fixed reason keys", () => {
    expect(isFreelanceReportReason("SCAM")).toBe(true);
    expect(isFreelanceReportReason("toString")).toBe(false);
    expect(isFreelanceReportReason("NOPE")).toBe(false);
  });
});
