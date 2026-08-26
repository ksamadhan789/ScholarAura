import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createCouponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(30)
      .transform((v) => v.toUpperCase()),
    discountType: z.enum(["PERCENT", "FIXED"]),
    discountValue: z.coerce.number().positive("Discount must be greater than 0"),
    appliesTo: z.enum(["ALL", "COURSE", "EVENT", "COMPETITION"]).default("ALL"),
    maxRedemptions: z.preprocess(
      (val) => (val === "" || val == null ? null : val),
      z.coerce.number().int().positive().nullable()
    ),
    minAmount: z.preprocess(
      (val) => (val === "" || val == null ? null : val),
      z.coerce.number().nonnegative().nullable()
    ),
    expiresAt: z.preprocess((val) => (val === "" || val == null ? null : val), z.coerce.date().nullable()),
  })
  .refine((data) => data.discountType !== "PERCENT" || data.discountValue <= 100, {
    message: "A percentage discount can't exceed 100",
    path: ["discountValue"],
  });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCouponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const existing = await prisma.coupon.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
  }

  const coupon = await prisma.coupon.create({ data: parsed.data });
  return NextResponse.json(coupon);
}
