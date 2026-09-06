import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";
import { getExchangeRate, convertFromInr } from "@/lib/currency";
import { JOB_BOOST_PRICE_INR, JOB_BOOST_DURATION_DAYS } from "@/lib/jobBoost";
import { checkRateLimit, CHECKOUT_ATTEMPT_LIMIT, CHECKOUT_WINDOW_MS } from "@/lib/rateLimit";

// A boost is always a paid, one-time purchase — no free variant, no
// coupons or credit-balance application (same v1 scope decision as bundle
// checkouts).
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const isOwner = session.user.id === job.postedByUserId;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (!job.isPublished || job.approvalStatus !== "APPROVED") {
    return NextResponse.json(
      { error: "Only a live, approved job listing can be boosted" },
      { status: 400 }
    );
  }

  const withinCheckoutLimit = await checkRateLimit(
    `job-boost-checkout:${session.user.id}`,
    CHECKOUT_ATTEMPT_LIMIT,
    CHECKOUT_WINDOW_MS
  );
  if (!withinCheckoutLimit) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const requestedCurrency = (body?.currency ?? "INR").toUpperCase();

  let payCurrency = "INR";
  let chargedAmount: number | null = null;

  if (requestedCurrency !== "INR") {
    const rate = await getExchangeRate(requestedCurrency);
    if (!rate) {
      return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
    }
    payCurrency = requestedCurrency;
    chargedAmount = convertFromInr(JOB_BOOST_PRICE_INR, Number(rate.rateFromInr));
  }

  try {
    const razorpay = getRazorpayClient();
    const chargeInThisCurrency = payCurrency === "INR" ? JOB_BOOST_PRICE_INR : chargedAmount!;
    const amountSubunits = Math.round(chargeInThisCurrency * 100);

    const order = await razorpay.orders.create({
      amount: amountSubunits,
      currency: payCurrency,
      receipt: `jobboost_${job.id}_${session.user.id}_${Date.now()}`.slice(0, 40),
    });

    const boost = await prisma.jobBoost.create({
      data: {
        jobId: job.id,
        purchasedByUserId: session.user.id,
        razorpayOrderId: order.id,
        amount: JOB_BOOST_PRICE_INR,
        currency: payCurrency,
        chargedAmount: payCurrency === "INR" ? null : chargedAmount,
        durationDays: JOB_BOOST_DURATION_DAYS,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      jobTitle: job.title,
      boostId: boost.id,
    });
  } catch (err) {
    console.error("Job boost checkout failed:", err);
    if (payCurrency !== "INR") {
      return NextResponse.json(
        {
          error: `Payments in ${payCurrency} aren't enabled on our account yet. Please pay in INR instead.`,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Couldn't start checkout. Please try again." },
      { status: 500 }
    );
  }
}
