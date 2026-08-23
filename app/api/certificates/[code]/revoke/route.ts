import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ reason: z.string().trim().max(300).optional() });

export async function POST(request: Request, { params }: { params: { code: string } }) {
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
  if (certificate.status === "REVOKED") {
    return NextResponse.json({ error: "Certificate is already revoked" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  const reason = parsed.success ? parsed.data.reason : undefined;

  await prisma.certificate.update({
    where: { id: certificate.id },
    data: { status: "REVOKED", revokedAt: new Date(), revokedReason: reason || null },
  });

  return NextResponse.json({ ok: true });
}
