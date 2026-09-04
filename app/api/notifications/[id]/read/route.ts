import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { id: params.id, userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
