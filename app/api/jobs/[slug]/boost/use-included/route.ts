import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JOB_BOOST_DURATION_DAYS, settleJobBoost } from "@/lib/jobBoost";
import { isActiveJobOwner } from "@/lib/jobOwnership";
import { getRecruiterPlanStatus } from "@/lib/recruiterPlan";

// Spends the Boost included with a recruiter's Pro plan (1 per 30 days) on
// one of their live jobs — a JobBoost row with no Razorpay order and a zero
// amount, settled immediately through the same settleJobBoost() a paid boost
// uses, so the featured window stacks the same way.
export async function POST(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job || !job.recruiterProfileId || !(await isActiveJobOwner(session.user.id, job))) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (!job.isPublished || job.approvalStatus !== "APPROVED") {
    return NextResponse.json({ error: "Only a live, approved job listing can be boosted" }, { status: 400 });
  }

  // Serialised per user so two quick clicks can't both spend the same Boost.
  const boost = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM users WHERE id = ${session.user.id} FOR UPDATE`;
    const plan = await getRecruiterPlanStatus(session.user.id);
    if (plan.includedBoostsLeft < 1) return null;
    return tx.jobBoost.create({
      data: {
        jobId: job.id,
        purchasedByUserId: session.user.id,
        amount: 0,
        currency: "INR",
        durationDays: JOB_BOOST_DURATION_DAYS,
        status: "PENDING",
      },
    });
  });
  if (!boost) {
    return NextResponse.json({ error: "You don't have an included Boost available right now" }, { status: 400 });
  }

  const settled = await settleJobBoost(boost.id, "included-with-pro-plan");
  return NextResponse.json({ featuredUntil: settled?.expiresAt ?? null });
}
