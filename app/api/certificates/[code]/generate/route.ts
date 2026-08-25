import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCertificate } from "@/lib/certificateGeneration";

export async function POST(_request: Request, { params }: { params: { code: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber: params.code },
  });
  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }
  if (certificate.status === "AVAILABLE") {
    return NextResponse.json(
      { error: "Certificate already generated. Use regenerate to overwrite it." },
      { status: 409 }
    );
  }

  const result = await generateCertificate(certificate.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
