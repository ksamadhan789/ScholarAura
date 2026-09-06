import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";
import { getExchangeRate, convertFromInr } from "@/lib/currency";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import { checkRateLimit, CHECKOUT_ATTEMPT_LIMIT, CHECKOUT_WINDOW_MS } from "@/lib/rateLimit";

// Coupons and credit-balance application aren't supported on bundle
// checkouts (v1 scope) — this mirrors the single-course checkout route
// minus that logic.
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }
  if (!(await hasCompletedOnboarding(session.user.id, session.user.role))) {
    return NextResponse.json(
      { error: "Please complete your profile before checking out.", code: "ONBOARDING_REQUIRED" },
      { status: 403 }
    );
  }

  const withinCheckoutLimit = await checkRateLimit(
    `bundle-checkout:${session.user.id}`,
    CHECKOUT_ATTEMPT_LIMIT,
    CHECKOUT_WINDOW_MS
  );
  if (!withinCheckoutLimit) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const bundle = await prisma.courseBundle.findUnique({ where: { slug: params.slug } });
  if (!bundle || !bundle.isPublished) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }
  if (Number(bundle.price) <= 0) {
    return NextResponse.json(
      { error: "This bundle is free — use the enroll endpoint instead" },
      { status: 400 }
    );
  }

  const existing = await prisma.bundlePurchase.findUnique({
    where: { userId_bundleId: { userId: session.user.id, bundleId: bundle.id } },
  });
  if (existing?.status === "SUCCESS") {
    return NextResponse.json({ error: "You already own this bundle" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedCurrency = (body?.currency ?? "INR").toUpperCase();

  const price = Number(bundle.price);
  let payCurrency = "INR";
  let chargedAmount: number | null = null;

  if (requestedCurrency !== "INR") {
    const rate = await getExchangeRate(requestedCurrency);
    if (!rate) {
      return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
    }
    payCurrency = requestedCurrency;
    chargedAmount = convertFromInr(price, Number(rate.rateFromInr));
  }

  try {
    const razorpay = getRazorpayClient();
    const chargeInThisCurrency = payCurrency === "INR" ? price : chargedAmount!;
    const amountSubunits = Math.round(chargeInThisCurrency * 100);

    const order = await razorpay.orders.create({
      amount: amountSubunits,
      currency: payCurrency,
      receipt: `bundle_${bundle.id}_${session.user.id}`.slice(0, 40),
    });

    const purchase = await prisma.bundlePurchase.upsert({
      where: { userId_bundleId: { userId: session.user.id, bundleId: bundle.id } },
      update: {
        razorpayOrderId: order.id,
        amount: price,
        currency: payCurrency,
        chargedAmount: payCurrency === "INR" ? null : chargedAmount,
        status: "PENDING",
      },
      create: {
        userId: session.user.id,
        bundleId: bundle.id,
        razorpayOrderId: order.id,
        amount: price,
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
      bundleName: bundle.title,
      purchaseId: purchase.id,
    });
  } catch (err) {
    console.error("Bundle checkout failed:", err);
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
