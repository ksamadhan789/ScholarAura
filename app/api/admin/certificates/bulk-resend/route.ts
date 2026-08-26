import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCertificateReadyEmail } from "@/lib/email";

const bodySchema = z
  .object({
    eventId: z.string().optional(),
    competitionId: z.string().optional(),
  })
  .refine((data) => Boolean(data.eventId) !== Boolean(data.competitionId), {
    message: "Provide exactly one of eventId or competitionId",
  });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { eventId, competitionId } = parsed.data;

  const certificates = await prisma.certificate.findMany({
    where: {
      status: { in: ["AVAILABLE", "GENERATED"] },
      ...(eventId ? { eventId } : { competitionId }),
    },
    include: { user: true, event: true, competition: true },
  });

  let sent = 0;
  let failed = 0;
  for (const certificate of certificates) {
    const title = certificate.event?.title ?? certificate.competition?.title ?? "";
    const ok = await sendCertificateReadyEmail(
      certificate.user.email,
      certificate.user.name,
      certificate.certificateNumber,
      title
    );
    if (ok) sent++;
    else failed++;
  }

  return NextResponse.json({ total: certificates.length, sent, failed });
}
