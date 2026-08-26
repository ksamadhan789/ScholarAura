import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";
import { computeCreditApplication, settleReferralCredit, InsufficientCreditError } from "@/lib/referral";
import { getExchangeRate, convertFromInr } from "@/lib/currency";
import { withEnrollmentNumber, buildGoogleFormUrl } from "@/lib/competitionEnrollment";
import { findValidCoupon, hasUserRedeemedCoupon, computeDiscount, CouponError } from "@/lib/coupon";
import { sendCompetitionEntryConfirmationEmail } from "@/lib/email";
import {
  checkRateLimit,
  CHECKOUT_ATTEMPT_LIMIT,
  CHECKOUT_WINDOW_MS,
  COUPON_ATTEMPT_LIMIT,
  COUPON_WINDOW_MS,
} from "@/lib/rateLimit";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const withinCheckoutLimit = await checkRateLimit(
    `checkout:${session.user.id}`,
    CHECKOUT_ATTEMPT_LIMIT,
    CHECKOUT_WINDOW_MS
  );
  if (!withinCheckoutLimit) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition || !competition.isPublished) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }
  if (new Date() > competition.submissionDeadline) {
    return NextResponse.json(
      { error: "Entries are closed for this competition" },
      { status: 400 }
    );
  }

  const existing = await prisma.competitionEntry.findUnique({
    where: { userId_competitionId: { userId: session.user.id, competitionId: competition.id } },
  });
  if (existing?.status === "SUCCESS") {
    return NextResponse.json({ error: "Already entered" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedCurrency = (body?.currency ?? "INR").toUpperCase();
  const teamName = typeof body?.teamName === "string" ? body.teamName.trim() || null : null;
  const teammates = typeof body?.teammates === "string" ? body.teammates.trim() || null : null;
  const certificateName =
    typeof body?.certificateName === "string" && body.certificateName.trim()
      ? body.certificateName.trim()
      : null;
  const couponCode = typeof body?.couponCode === "string" ? body.couponCode.trim() : "";

  let payCurrency = "INR";
  let chargedAmount: number | null = null;
  let fee = Number(competition.fee);
  let couponId: string | null = null;
  let discountAmount = 0;

  if (couponCode) {
    const withinCouponLimit = await checkRateLimit(
      `coupon:${session.user.id}`,
      COUPON_ATTEMPT_LIMIT,
      COUPON_WINDOW_MS
    );
    if (!withinCouponLimit) {
      return NextResponse.json(
        { error: "Too many coupon attempts. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }
    try {
      const coupon = await findValidCoupon(couponCode, "COMPETITION", fee);
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
      // Covers both genuinely free entries (fee = 0) and credit-covered
      // ones — guarded so concurrent duplicate requests can't each pay the
      // referrer a second time for one entry.
      const { entry, isFreshSettlement } = await withEnrollmentNumber(existing?.enrollmentNumber, (enrollmentNumber) =>
        prisma.$transaction(async (tx) => {
          const claimedExisting = await tx.competitionEntry.updateMany({
            where: { userId: session.user.id, competitionId: competition.id, status: { not: "SUCCESS" } },
            data: {
              status: "SUCCESS",
              amount: fee,
              creditApplied,
              currency: "INR",
              chargedAmount: null,
              razorpayOrderId: null,
              teamName,
              teammates,
              certificateName,
              enrollmentNumber,
              couponId,
              discountAmount,
            },
          });

          let isFreshSettlement = claimedExisting.count > 0;

          if (claimedExisting.count === 0) {
            try {
              await tx.competitionEntry.create({
                data: {
                  userId: session.user.id,
                  competitionId: competition.id,
                  amount: fee,
                  creditApplied,
                  currency: "INR",
                  status: "SUCCESS",
                  teamName,
                  teammates,
                  certificateName,
                  enrollmentNumber,
                  couponId,
                  discountAmount,
                },
              });
              isFreshSettlement = true;
            } catch (err) {
              if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                isFreshSettlement = false;
              } else {
                throw err;
              }
            }
          }

          if (isFreshSettlement) {
            await settleReferralCredit(tx, {
              buyerId: session.user.id,
              originalAmount: fee,
              creditApplied,
              description: `Competition: ${competition.title}`,
            });
            if (couponId) {
              await tx.coupon.update({ where: { id: couponId }, data: { redemptionCount: { increment: 1 } } });
            }
          }

          const settled = await tx.competitionEntry.findUniqueOrThrow({
            where: { userId_competitionId: { userId: session.user.id, competitionId: competition.id } },
          });
          return { entry: settled, isFreshSettlement };
        })
      );

      const googleFormUrl = buildGoogleFormUrl(competition, {
        name: certificateName ?? session.user.name ?? "",
        email: session.user.email ?? "",
        enrollmentNumber: entry.enrollmentNumber!,
      });

      if (isFreshSettlement) {
        await sendCompetitionEntryConfirmationEmail(
          session.user.email!,
          session.user.name ?? "",
          competition.title,
          competition.submissionDeadline,
          entry.enrollmentNumber
        ).catch((err) => console.error("Failed to send competition entry confirmation email:", err));
      }

      return NextResponse.json({
        paidWithCredit: true,
        competitionName: competition.title,
        entry,
        googleFormUrl,
      });
    }

    const razorpay = getRazorpayClient();
    const chargeInThisCurrency = payCurrency === "INR" ? amountDue : chargedAmount!;
    const amountSubunits = Math.round(chargeInThisCurrency * 100);

    const order = await razorpay.orders.create({
      amount: amountSubunits,
      currency: payCurrency,
      receipt: `competition_${competition.id}_${session.user.id}`.slice(0, 40),
    });

    const entry = await prisma.competitionEntry.upsert({
      where: { userId_competitionId: { userId: session.user.id, competitionId: competition.id } },
      update: {
        razorpayOrderId: order.id,
        amount: fee,
        creditApplied,
        currency: payCurrency,
        chargedAmount: payCurrency === "INR" ? null : chargedAmount,
        status: "PENDING",
        teamName,
        teammates,
        certificateName,
        couponId,
        discountAmount,
      },
      create: {
        userId: session.user.id,
        competitionId: competition.id,
        razorpayOrderId: order.id,
        amount: fee,
        creditApplied,
        currency: payCurrency,
        chargedAmount: payCurrency === "INR" ? null : chargedAmount,
        status: "PENDING",
        teamName,
        teammates,
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
      competitionName: competition.title,
      entryId: entry.id,
      creditApplied,
    });
  } catch (err) {
    if (err instanceof InsufficientCreditError) {
      return NextResponse.json(
        { error: "Your credit balance changed. Please retry checkout." },
        { status: 409 }
      );
    }
    console.error("Competition checkout failed:", err);
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
