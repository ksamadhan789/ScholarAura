import fs from "fs";
import path from "path";
import { Certificate, Course, Event, Competition, User } from "@prisma/client";
import { generateCertificatePdf } from "@/lib/generateCertificatePdf";
import { downloadFile } from "@/lib/google/driveService";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/siteUrl";
import { assertSafeExternalUrl } from "@/lib/ssrfGuard";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const LOGO_FETCH_TIMEOUT_MS = 10_000;

export type CertificateWithRelations = Certificate & {
  user: User;
  course: Course | null;
  event: Event | null;
  competition: Competition | null;
};

// The URL comes from an instructor/admin-set course/event/competition field —
// an untrusted, external input fetched on the platform's behalf, and this
// path is reachable from the public, unauthenticated certificate PDF route.
// Without the SSRF guard, this would be a way to make the server issue
// requests to internal services or cloud metadata endpoints.
async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    await assertSafeExternalUrl(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LOGO_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;

      const contentLength = Number(res.headers.get("content-length"));
      if (contentLength && contentLength > MAX_LOGO_BYTES) return null;

      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength > MAX_LOGO_BYTES) return null;
      return bytes;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return null;
  }
}

// Shared by the single-certificate PDF route and the bulk zip-download route.
// A Slides-generated certificate already has its final stamped PDF sitting in
// Drive — serve those bytes directly instead of re-rendering when possible.
export async function getCertificatePdfBytes(certificate: CertificateWithRelations): Promise<Uint8Array> {
  if (certificate.status === "AVAILABLE" && certificate.googleDriveFileId) {
    try {
      return await downloadFile(certificate.googleDriveFileId);
    } catch (err) {
      console.error(`Failed to fetch certificate PDF from Drive for ${certificate.certificateNumber}:`, err);
      // Fall through to the in-house generator below rather than erroring out.
    }
  }

  const title = certificate.course?.title ?? certificate.event?.title ?? certificate.competition?.title ?? "";
  const subtitle = certificate.course
    ? "for successfully completing the course"
    : "for participating in";

  let recipientName = certificate.user.name;
  if (certificate.eventId) {
    const registration = await prisma.eventRegistration.findUnique({
      where: { userId_eventId: { userId: certificate.userId, eventId: certificate.eventId } },
      select: { certificateName: true },
    });
    if (registration?.certificateName) {
      recipientName = registration.certificateName;
    }
  } else if (certificate.competitionId) {
    const entry = await prisma.competitionEntry.findUnique({
      where: {
        userId_competitionId: { userId: certificate.userId, competitionId: certificate.competitionId },
      },
      select: { certificateName: true },
    });
    if (entry?.certificateName) {
      recipientName = entry.certificateName;
    }
  }

  const orgLogoBytes = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));

  const partnerLogoUrl =
    certificate.course?.certificateLogoUrl ??
    certificate.event?.certificateLogoUrl ??
    certificate.competition?.certificateLogoUrl;
  const partnerLogoBytes = partnerLogoUrl ? await fetchImageBytes(partnerLogoUrl) : null;

  return generateCertificatePdf({
    recipientName,
    title,
    subtitle,
    certificateNumber: certificate.certificateNumber,
    issuedAt: certificate.issuedAt,
    verifyUrl: `${SITE_URL}/verify/${certificate.certificateNumber}`,
    orgLogoBytes,
    partnerLogoBytes,
  });
}
