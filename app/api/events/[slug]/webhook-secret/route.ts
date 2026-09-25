import crypto from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

// Replaces this event's Apps Script webhook secret, e.g. after it may have
// leaked. The old secret stops working immediately, so the new one must be
// pasted into the Apps Script's WEBHOOK_SECRET property.
export async function POST(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const event = await prisma.event.findUnique({ where: { slug: params.slug }, select: { id: true } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const updated = await prisma.event.update({
    where: { id: event.id },
    data: { webhookSecret: crypto.randomUUID() },
    select: { webhookSecret: true },
  });
  await logAdminAction({
    actorId: session.user.id,
    action: "WEBHOOK_SECRET_REGENERATED",
    targetType: "Event",
    targetId: event.id,
  });

  return NextResponse.json({ webhookSecret: updated.webhookSecret });
}
