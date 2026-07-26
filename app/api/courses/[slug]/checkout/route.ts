import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";
import { computeCreditApplication, settleReferralCredit } from "@/lib/referral";
import { getExchangeRate, convertFromInr } from "@/lib/currency";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({ where: { slug: params.slug } });
  if (!course || !course.isPublished) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (Number(course.price) <= 0) {
    return NextResponse.json(
      { error: "This course is free — use the enroll endpoint instead" },
      { status: 400 }
    );
  }

  const existing = await prisma.coursePurchase.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });
  if (existing?.status === "SUCCESS") {
    return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedCurrency = (body?.currency ?? "INR").toUpperCase();

  let payCurrency = "INR";
  let chargedAmount: number | null = null;
  const price = Number(course.price);

  if (requestedCurrency !== "INR") {
    const rate = await getExchangeRate(requestedCurrency);
    if (!rate) {
      return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
    }
    payCurrency = requestedCurrency;
    chargedAmount = convertFromInr(price, Number(rate.rateFromInr));
  }

  // Credit only applies to INR checkouts, to avoid cross-currency math issues.
  const { creditApplied, amountDue } =
    payCurrency === "INR"
      ? await computeCreditApplication(session.user.id, price)
      : { creditApplied: 0, amountDue: price };

  try {
    if (payCurrency === "INR" && amountDue <= 0) {
      // Credit fully covers the price — settle immediately, no Razorpay needed.
      // Guarded so concurrent duplicate requests (double-click, retry) can't
      // each deduct credit and pay the referrer a second time for one purchase.
      await prisma.$transaction(async (tx) => {
        const claimedExisting = await tx.coursePurchase.updateMany({
          where: { userId: session.user.id, courseId: course.id, status: { not: "SUCCESS" } },
          data: {
            status: "SUCCESS",
            amount: price,
            creditApplied,
            currency: "INR",
            chargedAmount: null,
            razorpayOrderId: null,
          },
        });

        let isFreshSettlement = claimedExisting.count > 0;

        if (claimedExisting.count === 0) {
          try {
            await tx.coursePurchase.create({
              data: {
                userId: session.user.id,
                courseId: course.id,
                amount: price,
                creditApplied,
                currency: "INR",
                status: "SUCCESS",
              },
            });
            isFreshSettlement = true;
          } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
              // A concurrent request already created/settled this purchase.
              isFreshSettlement = false;
            } else {
              throw err;
            }
          }
        }

        if (isFreshSettlement) {
          await settleReferralCredit(tx, {
            buyerId: session.user.id,
            originalAmount: price,
            creditApplied,
            description: `Course: ${course.title}`,
          });
        }
      });

      return NextResponse.json({ paidWithCredit: true, courseName: course.title });
    }

    const razorpay = getRazorpayClient();
    const chargeInThisCurrency = payCurrency === "INR" ? amountDue : chargedAmount!;
    const amountSubunits = Math.round(chargeInThisCurrency * 100);

    const order = await razorpay.orders.create({
      amount: amountSubunits,
      currency: payCurrency,
      receipt: `course_${course.id}_${session.user.id}`.slice(0, 40),
    });

    const purchase = await prisma.coursePurchase.upsert({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
      update: {
        razorpayOrderId: order.id,
        amount: price,
        creditApplied,
        currency: payCurrency,
        chargedAmount: payCurrency === "INR" ? null : chargedAmount,
        status: "PENDING",
      },
      create: {
        userId: session.user.id,
        courseId: course.id,
        razorpayOrderId: order.id,
        amount: price,
        creditApplied,
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
      courseName: course.title,
      purchaseId: purchase.id,
      creditApplied,
    });
  } catch (err) {
    console.error("Checkout failed:", err);
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
