import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReceiptPdf } from "@/lib/generateReceiptPdf";

type ReceiptType = "course" | "event" | "competition";

function isReceiptType(value: string): value is ReceiptType {
  return value === "course" || value === "event" || value === "competition";
}

export async function GET(
  _request: Request,
  { params }: { params: { type: string; id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  if (!isReceiptType(params.type)) {
    return NextResponse.json({ error: "Unknown receipt type" }, { status: 400 });
  }

  let record:
    | {
        id: string;
        userId: string;
        user: { name: string; email: string };
        amount: unknown;
        discountAmount: unknown;
        creditApplied: unknown;
        currency: string;
        chargedAmount: unknown;
        razorpayPaymentId: string | null;
        purchasedAt: Date;
        title: string;
        label: string;
      }
    | null = null;

  if (params.type === "course") {
    const purchase = await prisma.coursePurchase.findUnique({
      where: { id: params.id },
      include: { user: true, course: true },
    });
    if (purchase && purchase.status === "SUCCESS") {
      record = {
        id: purchase.id,
        userId: purchase.userId,
        user: purchase.user,
        amount: purchase.amount,
        discountAmount: purchase.discountAmount,
        creditApplied: purchase.creditApplied,
        currency: purchase.currency,
        chargedAmount: purchase.chargedAmount,
        razorpayPaymentId: purchase.razorpayPaymentId,
        purchasedAt: purchase.purchasedAt,
        title: purchase.course.title,
        label: "Course enrollment",
      };
    }
  } else if (params.type === "event") {
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: params.id },
      include: { user: true, event: true },
    });
    if (registration && registration.status === "CONFIRMED") {
      record = {
        id: registration.id,
        userId: registration.userId,
        user: registration.user,
        amount: registration.amount,
        discountAmount: registration.discountAmount,
        creditApplied: registration.creditApplied,
        currency: registration.currency,
        chargedAmount: registration.chargedAmount,
        razorpayPaymentId: registration.razorpayPaymentId,
        purchasedAt: registration.registeredAt,
        title: registration.event.title,
        label: "Event registration",
      };
    }
  } else {
    const entry = await prisma.competitionEntry.findUnique({
      where: { id: params.id },
      include: { user: true, competition: true },
    });
    if (entry && entry.status === "SUCCESS") {
      record = {
        id: entry.id,
        userId: entry.userId,
        user: entry.user,
        amount: entry.amount,
        discountAmount: entry.discountAmount,
        creditApplied: entry.creditApplied,
        currency: entry.currency,
        chargedAmount: entry.chargedAmount,
        razorpayPaymentId: entry.razorpayPaymentId,
        purchasedAt: entry.registeredAt,
        title: entry.competition.title,
        label: "Competition entry",
      };
    }
  }

  if (!record) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }
  if (record.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const amount = Number(record.amount);
  const discountAmount = Number(record.discountAmount);
  const creditApplied = Number(record.creditApplied);
  const netAmount = amount - discountAmount - creditApplied;
  const receiptNumber = `RCPT-${record.id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const orgLogoBytes = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));

  const pdfBytes = await generateReceiptPdf({
    receiptNumber,
    issuedAt: record.purchasedAt,
    buyerName: record.user.name,
    buyerEmail: record.user.email,
    itemLabel: record.label,
    itemTitle: record.title,
    amount,
    discountAmount,
    creditApplied,
    netAmount,
    currency: record.currency,
    chargedAmount: record.chargedAmount != null ? Number(record.chargedAmount) : null,
    paymentId: record.razorpayPaymentId,
    orgLogoBytes,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${receiptNumber}.pdf"`,
    },
  });
}
