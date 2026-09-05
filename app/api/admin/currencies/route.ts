import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

const upsertSchema = z.object({
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code, e.g. USD"),
  symbol: z.string().min(1).max(5),
  rateFromInr: z.coerce.number().finite().positive("Rate must be greater than 0"),
});

export async function GET() {
  const rates = await prisma.exchangeRate.findMany({ orderBy: { currencyCode: "asc" } });
  return NextResponse.json(rates);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { currencyCode, symbol, rateFromInr } = parsed.data;

  if (currencyCode === "INR") {
    return NextResponse.json(
      { error: "INR is the base currency and doesn't need a rate" },
      { status: 400 }
    );
  }

  const rate = await prisma.exchangeRate.upsert({
    where: { currencyCode },
    update: { symbol, rateFromInr },
    create: { currencyCode, symbol, rateFromInr },
  });

  await logAdminAction({
    actorId: session.user.id,
    action: "CURRENCY_RATE_SET",
    targetType: "ExchangeRate",
    targetId: rate.id,
    metadata: { currencyCode, symbol, rateFromInr: Number(rateFromInr) },
  });

  return NextResponse.json(rate, { status: 201 });
}
