import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCertificatePdfBytes } from "@/lib/certificatePdf";

export async function GET(
  _request: Request,
  { params }: { params: { code: string } }
) {
  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber: params.code },
    include: { user: true, course: true, event: true, competition: true },
  });

  if (!certificate) {
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
