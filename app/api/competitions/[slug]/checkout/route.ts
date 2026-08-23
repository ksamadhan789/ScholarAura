import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";
import { computeCreditApplication, settleReferralCredit, InsufficientCreditError } from "@/lib/referral";
import { getExchangeRate, convertFromInr } from "@/lib/currency";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
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

  let payCurrency = "INR";
  let chargedAmount: number | null = null;
  const fee = Number(competition.fee);

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
      await prisma.$transaction(async (tx) => {
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
        }
      });

      return NextResponse.json({ paidWithCredit: true, competitionName: competition.title });
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
