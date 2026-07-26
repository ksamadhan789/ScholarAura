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

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const registration = await prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
  });
  if (!registration || registration.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "No matching order found" }, { status: 404 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Guarded on status so a replayed/duplicate verification (the
      // Razorpay signature doesn't expire and can be resubmitted) can't
      // claim a second seat or re-settle referral credit for one registration.
      const claimedRegistration = await tx.eventRegistration.updateMany({
        where: { id: registration.id, status: { not: "CONFIRMED" } },
        data: { status: "CONFIRMED", razorpayPaymentId: razorpay_payment_id },
      });

      if (claimedRegistration.count > 0) {
        const claimedSeat = await tx.event.updateMany({
          where: { id: event.id, seatsFilled: { lt: event.seatsTotal } },
          data: { seatsFilled: { increment: 1 } },
        });

        if (claimedSeat.count === 0) {
          throw new Error("EVENT_FULL");
        }

        await settleReferralCredit(tx, {
          buyerId: session.user.id,
          originalAmount: Number(registration.amount),
          creditApplied: Number(registration.creditApplied),
          description: `Event: ${event.title}`,
        });
      }

      return tx.eventRegistration.findUniqueOrThrow({ where: { id: registration.id } });
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Error && err.message === "EVENT_FULL") {
      // Payment succeeded but the seat is gone — flagged for manual refund.
      return NextResponse.json(
        { error: "Your payment succeeded but the event filled up. Contact support for a refund." },
        { status: 409 }
      );
    }
    console.error("Event payment verification failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
