import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/siteUrl";
import {
  findOrCreateFolder,
  copyFile,
  exportAsPdf,
  uploadPdf,
  deleteFile,
} from "@/lib/google/driveService";
import { replacePlaceholders } from "@/lib/google/slidesService";
import { stampVerificationOnPdf } from "@/lib/generateCertificatePdf";

function buildPlaceholders(params: {
  name: string;
  eventTitle: string;
  certificateNumber: string;
  issuedAt: Date;
  certificateType: string;
  signatoryName: string | null;
  signatoryTitle: string | null;
  college: string | null;
}): Record<string, string> {
  return {
    "{{NAME}}": params.name,
    "{{EVENT_TITLE}}": params.eventTitle,
    "{{CERTIFICATE_NUMBER}}": params.certificateNumber,
    "{{DATE}}": params.issuedAt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    "{{CERTIFICATE_TYPE}}": params.certificateType,
    "{{COLLEGE}}": params.college ?? "",
    "{{SIGNATORY_NAME}}": params.signatoryName ?? "",
    "{{SIGNATORY_TITLE}}": params.signatoryTitle ?? "",
  };
}

/**
 * Runs the full Slides -> PDF pipeline for one event certificate: copies the
 * event's template, fills in placeholders, exports to PDF, stamps a
 * verification QR code, and uploads the result to Drive. Never throws past
 * the caller — failures are recorded on the Certificate row itself so a
 * batch run can report matched/failed without aborting the whole batch.
 */
export async function generateEventCertificate(
  certificateId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: { user: true, event: true },
  });
  if (!certificate || !certificate.eventId || !certificate.event) {
    return { ok: false, error: "Not an event certificate" };
  }

  const event = certificate.event;
  if (!event.googleSlidesTemplateId) {
    return { ok: false, error: "Event has no certificate template configured" };
  }

  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    return { ok: false, error: "GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured" };
  }

  await prisma.certificate.update({
    where: { id: certificateId },
    data: { status: "PROCESSING", lastAttemptAt: new Date() },
  });

  let slideCopyId: string | undefined;
  try {
    const registration = await prisma.eventRegistration.findUnique({
      where: { userId_eventId: { userId: certificate.userId, eventId: event.id } },
      select: { certificateName: true },
    });
    const recipientName = registration?.certificateName || certificate.user.name;

    const yearFolderId = await findOrCreateFolder(String(certificate.issuedAt.getFullYear()), rootFolderId);
    const eventFolderId = await findOrCreateFolder(event.slug, yearFolderId);

    slideCopyId = await copyFile(
      event.googleSlidesTemplateId,
      `${certificate.certificateNumber} - ${recipientName}`,
      eventFolderId
    );

    await replacePlaceholders(
      slideCopyId,
      buildPlaceholders({
        name: recipientName,
        eventTitle: event.title,
        certificateNumber: certificate.certificateNumber,
        issuedAt: certificate.issuedAt,
        certificateType: certificate.certificateType ?? event.certificateType ?? "PARTICIPATION",
        signatoryName: event.certificateSignatoryName,
        signatoryTitle: event.certificateSignatoryTitle,
        college: certificate.user.organization,
      })
    );

    const exportedPdf = await exportAsPdf(slideCopyId);
    const stampedPdf = await stampVerificationOnPdf(
      exportedPdf,
      certificate.certificateNumber,
      `${SITE_URL}/verify/${certificate.certificateNumber}`
    );

    const driveFileId = await uploadPdf(`${certificate.certificateNumber}.pdf`, eventFolderId, stampedPdf);

    await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: "AVAILABLE",
        googleSlideFileId: slideCopyId,
        googleDriveFileId: driveFileId,
        errorMessage: null,
      },
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error generating certificate";
    console.error(`Certificate generation failed for ${certificateId}:`, err);

    await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: "FAILED",
        errorMessage: message.slice(0, 500),
        retryCount: { increment: 1 },
      },
    });
    // Don't leave a half-filled Slides copy behind on failure — a retry
    // creates a fresh one, so an orphaned copy would just be dead weight.
    if (slideCopyId) {
      await deleteFile(slideCopyId).catch(() => {});
    }
    return { ok: false, error: message };
  }
}
