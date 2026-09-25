import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { settleRecruiterSubscription } from "@/lib/recruiterPlan";

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const parsed = verifySchema.safeParse(await request.json().catch(() => null));
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

  const subscription = await prisma.recruiterSubscription.findFirst({
    where: { userId: session.user.id, razorpayOrderId: razorpay_order_id },
  });
  if (!subscription) {
    return NextResponse.json({ error: "No matching order found" }, { status: 404 });
  }

  // Idempotent — the Razorpay webhook may settle the same payment too.
  const settled = await settleRecruiterSubscription(subscription.id, razorpay_payment_id);
  return NextResponse.json({ status: settled?.status, startsAt: settled?.startsAt, endsAt: settled?.endsAt });
}
