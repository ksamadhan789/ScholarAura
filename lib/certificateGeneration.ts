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
import { sendCertificateReadyEmail } from "@/lib/email";

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

    await sendCertificateReadyEmail(
      certificate.user.email,
      certificate.user.name,
      certificate.certificateNumber,
      event.title
    );

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

/**
 * Same pipeline as generateEventCertificate, for a competition certificate.
 * Reuses buildPlaceholders as-is — the {{EVENT_TITLE}} placeholder just gets
 * the competition's title, keeping one placeholder vocabulary for admins
 * designing templates regardless of which kind of certificate they're for.
 */
export async function generateCompetitionCertificate(
  certificateId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: { user: true, competition: true },
  });
  if (!certificate || !certificate.competitionId || !certificate.competition) {
    return { ok: false, error: "Not a competition certificate" };
  }

  const competition = certificate.competition;
  if (!competition.googleSlidesTemplateId) {
    return { ok: false, error: "Competition has no certificate template configured" };
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
    const entry = await prisma.competitionEntry.findUnique({
      where: { userId_competitionId: { userId: certificate.userId, competitionId: competition.id } },
      select: { certificateName: true },
    });
    const recipientName = entry?.certificateName || certificate.user.name;

    const yearFolderId = await findOrCreateFolder(String(certificate.issuedAt.getFullYear()), rootFolderId);
    const competitionFolderId = await findOrCreateFolder(competition.slug, yearFolderId);

    slideCopyId = await copyFile(
      competition.googleSlidesTemplateId,
      `${certificate.certificateNumber} - ${recipientName}`,
      competitionFolderId
    );

    await replacePlaceholders(
      slideCopyId,
      buildPlaceholders({
        name: recipientName,
        eventTitle: competition.title,
        certificateNumber: certificate.certificateNumber,
        issuedAt: certificate.issuedAt,
        certificateType: certificate.certificateType ?? competition.certificateType ?? "PARTICIPATION",
        signatoryName: competition.certificateSignatoryName,
        signatoryTitle: competition.certificateSignatoryTitle,
        college: certificate.user.organization,
      })
    );

    const exportedPdf = await exportAsPdf(slideCopyId);
    const stampedPdf = await stampVerificationOnPdf(
      exportedPdf,
      certificate.certificateNumber,
      `${SITE_URL}/verify/${certificate.certificateNumber}`
    );

    const driveFileId = await uploadPdf(`${certificate.certificateNumber}.pdf`, competitionFolderId, stampedPdf);

    await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: "AVAILABLE",
        googleSlideFileId: slideCopyId,
        googleDriveFileId: driveFileId,
        errorMessage: null,
      },
    });

    await sendCertificateReadyEmail(
      certificate.user.email,
      certificate.user.name,
      certificate.certificateNumber,
      competition.title
    );

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
    if (slideCopyId) {
      await deleteFile(slideCopyId).catch(() => {});
    }
    return { ok: false, error: message };
  }
}

/** Dispatches to the right pipeline based on which entity the certificate belongs to. */
export async function generateCertificate(
  certificateId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    select: { eventId: true, competitionId: true },
  });
  if (!certificate) {
    return { ok: false, error: "Certificate not found" };
  }
  if (certificate.eventId) return generateEventCertificate(certificateId);
  if (certificate.competitionId) return generateCompetitionCertificate(certificateId);
  return { ok: false, error: "Not an event or competition certificate" };
}
