import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

export async function DELETE(
  _request: Request,
  { params }: { params: { code: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const deleted = await prisma.exchangeRate.delete({ where: { currencyCode: params.code } }).catch(() => null);
  if (deleted) {
    await logAdminAction({
      actorId: session.user.id,
      action: "CURRENCY_RATE_DELETED",
      targetType: "ExchangeRate",
      targetId: deleted.id,
      metadata: { currencyCode: deleted.currencyCode },
    });
  }
  return NextResponse.json({ ok: true });
}
