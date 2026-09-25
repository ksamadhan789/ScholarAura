import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";
import { getExchangeRate, convertFromInr } from "@/lib/currency";
import { PRO_PRICE_INR } from "@/lib/recruiterPlan";
import { checkRateLimit, CHECKOUT_ATTEMPT_LIMIT, CHECKOUT_WINDOW_MS } from "@/lib/rateLimit";

const checkoutSchema = z.object({
  period: z.enum(["MONTHLY", "YEARLY"]),
  currency: z.string().optional(),
});

// Starts a one-off Razorpay payment for a Pro period (lib/recruiterPlan.ts).
// Like job boosts: no coupons or referral credit, and nothing recurring —
// the recruiter renews by paying again.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }
  if (session.user.role !== "RECRUITER") {
    return NextResponse.json({ error: "Only recruiter accounts can buy a plan" }, { status: 403 });
  }
  const recruiterProfile = await prisma.recruiterProfile.findUnique({ where: { userId: session.user.id } });
  if (!recruiterProfile || recruiterProfile.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Your recruiter account must be approved before you can buy a plan" },
      { status: 403 },
    );
  }

  const withinCheckoutLimit = await checkRateLimit(
    `recruiter-plan-checkout:${session.user.id}`,
    CHECKOUT_ATTEMPT_LIMIT,
    CHECKOUT_WINDOW_MS,
  );
  if (!withinCheckoutLimit) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose monthly or yearly" }, { status: 400 });
  }
  const { period } = parsed.data;
  const priceInr = PRO_PRICE_INR[period];
  const requestedCurrency = (parsed.data.currency ?? "INR").toUpperCase();

  let payCurrency = "INR";
  let chargedAmount: number | null = null;
  if (requestedCurrency !== "INR") {
    const rate = await getExchangeRate(requestedCurrency);
    if (!rate) {
      return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
    }
    payCurrency = requestedCurrency;
    chargedAmount = convertFromInr(priceInr, Number(rate.rateFromInr));
  }

  try {
    const razorpay = getRazorpayClient();
    const chargeInThisCurrency = payCurrency === "INR" ? priceInr : chargedAmount!;
    const order = await razorpay.orders.create({
      amount: Math.round(chargeInThisCurrency * 100),
      currency: payCurrency,
      receipt: `plan_${period.toLowerCase()}_${session.user.id}_${Date.now()}`.slice(0, 40),
    });

    const subscription = await prisma.recruiterSubscription.create({
      data: {
        userId: session.user.id,
        period,
        razorpayOrderId: order.id,
        amount: priceInr,
        currency: payCurrency,
        chargedAmount: payCurrency === "INR" ? null : chargedAmount,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      subscriptionId: subscription.id,
    });
  } catch (err) {
    console.error("Recruiter plan checkout failed:", err);
    if (payCurrency !== "INR") {
      return NextResponse.json(
        { error: `Payments in ${payCurrency} aren't enabled on our account yet. Please pay in INR instead.` },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 500 });
  }
}
