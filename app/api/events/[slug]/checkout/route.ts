import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";
import { computeCreditApplication, settleReferralCredit, InsufficientCreditError } from "@/lib/referral";
import { getExchangeRate, convertFromInr } from "@/lib/currency";
import { withEnrollmentNumber, buildGoogleFormUrl } from "@/lib/enrollment";
import { findValidCoupon, hasUserRedeemedCoupon, computeDiscount, CouponError } from "@/lib/coupon";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event || !event.isPublished) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (Number(event.fee) <= 0) {
    return NextResponse.json(
      { error: "This event is free — use the register endpoint instead" },
      { status: 400 }
    );
  }

  const existing = await prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
  });
  if (existing?.status === "CONFIRMED") {
    return NextResponse.json({ error: "Already registered" }, { status: 409 });
  }
  if (event.seatsFilled >= event.seatsTotal) {
    return NextResponse.json({ error: "This event is full" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedCurrency = (body?.currency ?? "INR").toUpperCase();
  const certificateName =
    typeof body?.certificateName === "string" && body.certificateName.trim()
      ? body.certificateName.trim()
      : null;
  const couponCode = typeof body?.couponCode === "string" ? body.couponCode.trim() : "";

  let payCurrency = "INR";
  let chargedAmount: number | null = null;
  let fee = Number(event.fee);
  let couponId: string | null = null;
  let discountAmount = 0;

  if (couponCode) {
    try {
      const coupon = await findValidCoupon(couponCode, "EVENT", fee);
      if (await hasUserRedeemedCoupon(session.user.id, coupon.id)) {
        throw new CouponError("You've already used this coupon");
      }
      discountAmount = computeDiscount(coupon, fee);
      couponId = coupon.id;
      fee = Math.round((fee - discountAmount) * 100) / 100;
    } catch (err) {
      if (err instanceof CouponError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }
  }

  if (requestedCurrency !== "INR") {
    const rate = await getExchangeRate(requestedCurrency);
    if (!rate) {
      return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
    }
    payCurrency = requestedCurrency;
    chargedAmount = convertFromInr(fee, Number(rate.rateFromInr));
  }

  const { creditApplied, amountDue } =
    payCurrency === "INR"
      ? await computeCreditApplication(session.user.id, fee)
      : { creditApplied: 0, amountDue: fee };

  try {
    if (payCurrency === "INR" && amountDue <= 0) {
      // Guarded so concurrent duplicate requests (double-click, retry) can't
      // each claim a seat and pay the referrer a second time for one registration.
      try {
        const registration = await withEnrollmentNumber(
          existing?.enrollmentNumber,
          (enrollmentNumber) =>
            prisma.$transaction(async (tx) => {
              const claimedExisting = await tx.eventRegistration.updateMany({
                where: { userId: session.user.id, eventId: event.id, status: { not: "CONFIRMED" } },
                data: {
                  status: "CONFIRMED",
                  amount: fee,
                  creditApplied,
                  currency: "INR",
                  chargedAmount: null,
                  razorpayOrderId: null,
                  certificateName,
                  enrollmentNumber,
                  couponId,
                  discountAmount,
                },
              });

              let isFreshSettlement = claimedExisting.count > 0;

              if (claimedExisting.count === 0) {
                try {
                  await tx.eventRegistration.create({
                    data: {
                      userId: session.user.id,
                      eventId: event.id,
                      amount: fee,
                      creditApplied,
                      currency: "INR",
                      status: "CONFIRMED",
                      certificateName,
                      enrollmentNumber,
                      couponId,
                      discountAmount,
                    },
                  });
                  isFreshSettlement = true;
                } catch (err) {
                  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                    // A concurrent request already created/settled this registration.
                    isFreshSettlement = false;
                  } else {
                    throw err;
                  }
                }
              }

              if (isFreshSettlement) {
                const claimedSeat = await tx.event.updateMany({
                  where: { id: event.id, seatsFilled: { lt: event.seatsTotal } },
                  data: { seatsFilled: { increment: 1 } },
                });
                if (claimedSeat.count === 0) {
                  throw new Error("EVENT_FULL");
                }

                await settleReferralCredit(tx, {
                  buyerId: session.user.id,
                  originalAmount: fee,
                  creditApplied,
                  description: `Event: ${event.title}`,
                });
                if (couponId) {
                  await tx.coupon.update({ where: { id: couponId }, data: { redemptionCount: { increment: 1 } } });
                }
              }

              return tx.eventRegistration.findUniqueOrThrow({
                where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
              });
            })
        );

        const googleFormUrl = buildGoogleFormUrl(event, {
          name: certificateName ?? session.user.name ?? "",
          email: session.user.email ?? "",
          enrollmentNumber: registration.enrollmentNumber!,
        });

        return NextResponse.json({
          paidWithCredit: true,
          eventName: event.title,
          registration,
          googleFormUrl,
        });
      } catch (err) {
        if (err instanceof Error && err.message === "EVENT_FULL") {
          return NextResponse.json({ error: "This event is full" }, { status: 409 });
        }
        throw err;
      }
    }

    const razorpay = getRazorpayClient();
    const chargeInThisCurrency = payCurrency === "INR" ? amountDue : chargedAmount!;
    const amountSubunits = Math.round(chargeInThisCurrency * 100);

    const order = await razorpay.orders.create({
      amount: amountSubunits,
      currency: payCurrency,
      receipt: `event_${event.id}_${session.user.id}`.slice(0, 40),
    });

    const registration = await prisma.eventRegistration.upsert({
      where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
      update: {
        razorpayOrderId: order.id,
        amount: fee,
        creditApplied,
        currency: payCurrency,
        chargedAmount: payCurrency === "INR" ? null : chargedAmount,
        status: "PENDING",
        certificateName,
        couponId,
        discountAmount,
      },
      create: {
        userId: session.user.id,
        eventId: event.id,
        razorpayOrderId: order.id,
        amount: fee,
        creditApplied,
        currency: payCurrency,
        chargedAmount: payCurrency === "INR" ? null : chargedAmount,
        status: "PENDING",
        certificateName,
        couponId,
        discountAmount,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      eventName: event.title,
      registrationId: registration.id,
      creditApplied,
    });
  } catch (err) {
    if (err instanceof InsufficientCreditError) {
      return NextResponse.json(
        { error: "Your credit balance changed. Please retry checkout." },
        { status: 409 }
      );
    }
    console.error("Event checkout failed:", err);
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
