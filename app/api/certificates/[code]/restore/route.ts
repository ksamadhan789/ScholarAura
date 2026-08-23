import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  if (certificate.status !== "REVOKED") {
    return NextResponse.json({ error: "Certificate is not revoked" }, { status: 409 });
  }

  await prisma.certificate.update({
    where: { id: certificate.id },
    data: {
      // A real generated file means AVAILABLE; otherwise this predates the
      // Slides pipeline (or has no template configured), so fall back to the
      // in-house-PDF GENERATED state it was in before being revoked.
      status: certificate.googleDriveFileId ? "AVAILABLE" : "GENERATED",
      revokedAt: null,
      revokedReason: null,
    },
  });

  return NextResponse.json({ ok: true });
}
