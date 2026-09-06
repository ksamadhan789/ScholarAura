import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { settleBundlePurchase } from "@/lib/bundlePurchase";

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(request: Request, { params }: { params: { slug: string } }) {
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

  const bundle = await prisma.courseBundle.findUnique({ where: { slug: params.slug } });
  if (!bundle) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }

  const purchase = await prisma.bundlePurchase.findUnique({
    where: { userId_bundleId: { userId: session.user.id, bundleId: bundle.id } },
  });
  if (!purchase || purchase.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "No matching order found" }, { status: 404 });
  }

  // Idempotent — also safe to call again from the Razorpay webhook.
  const updated = await settleBundlePurchase(purchase.id, razorpay_payment_id);
  return NextResponse.json(updated);
}
