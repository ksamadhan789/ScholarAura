import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

const updateCouponSchema = z.object({
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCouponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const coupon = await prisma.coupon.update({ where: { id: params.id }, data: parsed.data });
  await logAdminAction({
    actorId: session.user.id,
    action: "COUPON_UPDATED",
    targetType: "Coupon",
    targetId: coupon.id,
    metadata: { code: coupon.code, isActive: coupon.isActive },
  });
  return NextResponse.json(coupon);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  // Never hard-delete a coupon that's already been used — that would orphan
  // the couponId reference on any purchase/registration/entry that redeemed
  // it. Deactivate instead; only allow a real delete for one that's unused.
  const coupon = await prisma.coupon.findUnique({ where: { id: params.id } });
  if (!coupon) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }
  if (coupon.redemptionCount > 0) {
    return NextResponse.json(
      { error: "This coupon has already been used and can't be deleted — deactivate it instead" },
      { status: 400 }
    );
  }

  await prisma.coupon.delete({ where: { id: params.id } });
  await logAdminAction({
    actorId: session.user.id,
    action: "COUPON_DELETED",
    targetType: "Coupon",
    targetId: params.id,
    metadata: { code: coupon.code },
  });
  return NextResponse.json({ ok: true });
}
