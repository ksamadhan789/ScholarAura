import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { settleReferralCredit } from "@/lib/referral";

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const validSignature = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!validSignature) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { slug: params.slug } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const purchase = await prisma.coursePurchase.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });
  if (!purchase || purchase.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "No matching order found" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.coursePurchase.update({
      where: { id: purchase.id },
      data: { status: "SUCCESS", razorpayPaymentId: razorpay_payment_id },
    });

    await settleReferralCredit(tx, {
      buyerId: session.user.id,
      originalAmount: Number(purchase.amount),
      creditApplied: Number(purchase.creditApplied),
      description: `Course: ${course.title}`,
    });

    return result;
  });

  return NextResponse.json(updated);
}
