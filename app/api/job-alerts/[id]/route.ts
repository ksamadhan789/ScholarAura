import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ownAlert(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const alert = await prisma.jobAlert.findUnique({ where: { id } });
  return alert && alert.userId === session.user.id ? alert : null;
}

// Pause / resume.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const parsed = z.object({ isActive: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const alert = await ownAlert(params.id);
  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }
  await prisma.jobAlert.update({ where: { id: alert.id }, data: { isActive: parsed.data.isActive } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const alert = await ownAlert(params.id);
  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }
  await prisma.jobAlert.delete({ where: { id: alert.id } });
  return NextResponse.json({ ok: true });
}
