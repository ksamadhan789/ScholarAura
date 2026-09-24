import { prisma } from "@/lib/prisma";
import type { FreelanceReportReason } from "@/lib/freelanceReportReasons";

export class ReportNotFoundError extends Error {
  constructor() {
    super("REPORT_NOT_FOUND");
  }
}

export class ListingNotFoundError extends Error {
  constructor() {
    super("LISTING_NOT_FOUND");
  }
}

/**
 * Files a report, or — if this person already has an OPEN report on the same
 * listing — updates that one instead, so repeated clicks can't pile up
 * duplicates in the admin queue. `created` tells the caller whether to alert
 * admins (only on a genuinely new report).
 */
export async function createFreelanceReport(params: {
  listingId: string;
  reporterId: string;
  reason: FreelanceReportReason;
  details: string | null;
}) {
  const existing = await prisma.freelanceReport.findFirst({
    where: { listingId: params.listingId, reporterId: params.reporterId, status: "OPEN" },
    select: { id: true },
  });
  if (existing) {
    const report = await prisma.freelanceReport.update({
      where: { id: existing.id },
      data: { reason: params.reason, details: params.details },
    });
    return { report, created: false };
  }

  const report = await prisma.freelanceReport.create({
    data: {
      listingId: params.listingId,
      reporterId: params.reporterId,
      reason: params.reason,
      details: params.details,
    },
  });
  return { report, created: true };
}

/** Admin decided the listing is fine — closes just this one report. */
export async function dismissFreelanceReport(reportId: string) {
  const report = await prisma.freelanceReport.findUnique({ where: { id: reportId } });
  if (!report || report.status !== "OPEN") throw new ReportNotFoundError();

  return prisma.freelanceReport.update({
    where: { id: reportId },
    data: { status: "DISMISSED", resolvedAt: new Date() },
  });
}

/**
 * Admin takes a listing down: unpublishes it, marks it removed (so the owner
 * can't just republish it), and closes every open report on it at once —
 * several people reporting the same listing shouldn't need handling one by one.
 */
export async function removeFreelanceListing(listingId: string) {
  const listing = await prisma.freelanceListing.findUnique({ where: { id: listingId } });
  if (!listing) throw new ListingNotFoundError();

  const now = new Date();
  await prisma.$transaction([
    prisma.freelanceListing.update({
      where: { id: listingId },
      data: { isPublished: false, removedByAdminAt: now },
    }),
    prisma.freelanceReport.updateMany({
      where: { listingId, status: "OPEN" },
      data: { status: "ACTIONED", resolvedAt: now },
    }),
  ]);
  return listing;
}

/**
 * Undoes a removal. Leaves the listing paused — the owner decides whether to
 * republish it — but lets them do so again.
 */
export async function restoreFreelanceListing(listingId: string) {
  const listing = await prisma.freelanceListing.findUnique({ where: { id: listingId } });
  if (!listing || !listing.removedByAdminAt) throw new ListingNotFoundError();

  return prisma.freelanceListing.update({
    where: { id: listingId },
    data: { removedByAdminAt: null },
  });
}
