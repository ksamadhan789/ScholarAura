import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEventCertificate } from "@/lib/certificateGeneration";

// Processed sequentially, one batch at a time — this is the admin-triggered
// alternative to a cron job, so it must finish within one serverless
// function's time limit. Capped well under that so a large backlog is
// worked off over a few clicks rather than timing out mid-batch.
const BATCH_SIZE = 10;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const pending = await prisma.certificate.findMany({
    where: {
      eventId: { not: null },
      status: { in: ["ELIGIBLE", "FAILED"] },
      event: { googleSlidesTemplateId: { not: null } },
    },
    select: { id: true },
    orderBy: { issuedAt: "asc" },
    take: BATCH_SIZE,
  });

  let succeeded = 0;
  let failed = 0;
  for (const { id } of pending) {
    const result = await generateEventCertificate(id);
    if (result.ok) succeeded++;
    else failed++;
  }

  const remaining = await prisma.certificate.count({
    where: {
      eventId: { not: null },
      status: { in: ["ELIGIBLE", "FAILED"] },
      event: { googleSlidesTemplateId: { not: null } },
    },
  });

  return NextResponse.json({ processed: pending.length, succeeded, failed, remaining });
}
