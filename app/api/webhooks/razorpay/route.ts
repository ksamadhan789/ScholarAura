import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import {
  settleCoursePurchase,
  settleEventRegistration,
  settleCompetitionEntry,
  PaymentNotHonoredError,
} from "@/lib/paymentSettlement";
import { settleJobBoost } from "@/lib/jobBoost";
import { settleRecruiterSubscription } from "@/lib/recruiterPlan";

// Server-to-server safety net for payment confirmation: the checkout flow
// normally relies on the buyer's browser calling verify-payment after
// Razorpay's checkout succeeds, but if the browser closes/crashes right
// after a real charge goes through, that call never happens and the
// purchase/registration is stuck PENDING despite money having moved. This
// endpoint reconciles that from Razorpay's side regardless of what the
// buyer's browser does. Settlement itself is idempotent (see
// lib/paymentSettlement.ts), so it's safe for this to fire in addition to
// the normal browser-driven verification.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.event !== "payment.captured") {
    // Nothing to reconcile for other event types (payment.failed, refund.*,
    // etc.) — acknowledge so Razorpay doesn't keep retrying this delivery.
    return NextResponse.json({ received: true });
  }

  const payment = body.payload?.payment?.entity;
  const orderId = payment?.order_id;
  const paymentId = payment?.id;
  if (!orderId || !paymentId) {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  try {
    const coursePurchase = await prisma.coursePurchase.findFirst({
      where: { razorpayOrderId: orderId },
    });
    if (coursePurchase) {
      await settleCoursePurchase(coursePurchase.id, paymentId);
      return NextResponse.json({ received: true });
    }

    const eventRegistration = await prisma.eventRegistration.findFirst({
      where: { razorpayOrderId: orderId },
    });
    if (eventRegistration) {
      await settleEventRegistration(eventRegistration.id, paymentId);
      return NextResponse.json({ received: true });
    }

    const competitionEntry = await prisma.competitionEntry.findFirst({
      where: { razorpayOrderId: orderId },
    });
    if (competitionEntry) {
      await settleCompetitionEntry(competitionEntry.id, paymentId);
      return NextResponse.json({ received: true });
    }

    const jobBoost = await prisma.jobBoost.findFirst({
      where: { razorpayOrderId: orderId },
    });
    if (jobBoost) {
      await settleJobBoost(jobBoost.id, paymentId);
      return NextResponse.json({ received: true });
    }

    const recruiterSubscription = await prisma.recruiterSubscription.findFirst({
      where: { razorpayOrderId: orderId },
    });
    if (recruiterSubscription) {
      await settleRecruiterSubscription(recruiterSubscription.id, paymentId);
      return NextResponse.json({ received: true });
    }

    // No purchase/registration/entry references this order — acknowledge
    // anyway so Razorpay doesn't retry a delivery we can't ever act on.
    console.warn(`Razorpay webhook: no purchase/registration/entry found for order ${orderId}`);
    return NextResponse.json({ received: true });
  } catch (err) {
    if (err instanceof PaymentNotHonoredError) {
      // Event full / credit already spent (payment refunded automatically), or
      // a late delivery for a purchase that was already refunded — nothing
      // more to do, and retrying wouldn't change that.
      console.warn(`Razorpay webhook: payment ${paymentId} for order ${orderId} not settled (${err.reason})`);
      return NextResponse.json({ received: true });
    }
    console.error("Razorpay webhook settlement failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
