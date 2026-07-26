import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/lib/generateCertificatePdf";
import { SITE_URL } from "@/lib/siteUrl";

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

  const pdfBytes = await generateCertificatePdf({
    recipientName: certificate.user.name,
    title,
    subtitle,
    certificateNumber: certificate.certificateNumber,
    issuedAt: certificate.issuedAt,
    verifyUrl: `${SITE_URL}/verify/${certificate.certificateNumber}`,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${certificate.certificateNumber}.pdf"`,
    },
  });
}
