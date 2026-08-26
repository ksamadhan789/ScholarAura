import fs from "fs";
import path from "path";
import { Certificate, Course, Event, Competition, User } from "@prisma/client";
import { generateCertificatePdf } from "@/lib/generateCertificatePdf";
import { downloadFile } from "@/lib/google/driveService";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/siteUrl";

export type CertificateWithRelations = Certificate & {
  user: User;
  course: Course | null;
  event: Event | null;
  competition: Competition | null;
};

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
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
