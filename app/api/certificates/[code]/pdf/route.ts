import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCertificatePdfBytes } from "@/lib/certificatePdf";
import { checkRateLimit, CERTIFICATE_VERIFY_ATTEMPT_LIMIT, CERTIFICATE_VERIFY_WINDOW_MS } from "@/lib/rateLimit";

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const withinLimit = await checkRateLimit(
    `verify-cert:${remoteIp ?? "unknown"}`,
    CERTIFICATE_VERIFY_ATTEMPT_LIMIT,
    CERTIFICATE_VERIFY_WINDOW_MS
  );
  if (!withinLimit) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber: params.code },
    include: { user: true, course: true, event: true, competition: true },
  });

  // A revoked certificate is no longer "publicly verifiable" — refunding a
  // purchase revokes it for exactly this reason (see revokeCertificateForRefund
  // in lib/refund.ts), so serving the PDF anyway would defeat that entirely.
  if (!certificate || certificate.status === "REVOKED") {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const pdfBytes = await getCertificatePdfBytes(certificate);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${certificate.certificateNumber}.pdf"`,
    },
  });
}
