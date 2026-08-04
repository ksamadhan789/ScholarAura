import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/lib/generateCertificatePdf";
import { SITE_URL } from "@/lib/siteUrl";

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { code: string } }
) {
  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber: params.code },
    include: { user: true, course: true, event: true },
  });

  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const title = certificate.course?.title ?? certificate.event?.title ?? "";
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
  }

  const orgLogoBytes = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));

  const partnerLogoUrl = certificate.course?.certificateLogoUrl ?? certificate.event?.certificateLogoUrl;
  const partnerLogoBytes = partnerLogoUrl ? await fetchImageBytes(partnerLogoUrl) : null;

  const pdfBytes = await generateCertificatePdf({
    recipientName,
    title,
    subtitle,
    certificateNumber: certificate.certificateNumber,
    issuedAt: certificate.issuedAt,
    verifyUrl: `${SITE_URL}/verify/${certificate.certificateNumber}`,
    orgLogoBytes,
    partnerLogoBytes,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${certificate.certificateNumber}.pdf"`,
    },
  });
}
