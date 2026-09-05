import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAdminDigestEmail } from "@/lib/email";
import { secretsMatch } from "@/lib/timingSafeEqual";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");
  if (!secret || !provided) return false;
  return secretsMatch(provided, `Bearer ${secret}`);
}

function netAmount(amount: unknown, creditApplied: unknown): number {
  return Number(amount) - Number(creditApplied);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    newStudents,
    coursePurchases,
    eventRegistrations,
    competitionEntries,
    pendingColleges,
    failedCertificates,
    pendingRecruiters,
    pendingJobs,
    admins,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT", createdAt: { gte: since } } }),
    prisma.coursePurchase.findMany({
      where: { status: "SUCCESS", purchasedAt: { gte: since } },
      select: { amount: true, creditApplied: true },
    }),
    prisma.eventRegistration.findMany({
      where: { status: "CONFIRMED", registeredAt: { gte: since } },
      select: { amount: true, creditApplied: true },
    }),
    prisma.competitionEntry.findMany({
      where: { status: "SUCCESS", registeredAt: { gte: since } },
      select: { amount: true, creditApplied: true },
    }),
    prisma.college.count({ where: { status: "PENDING" } }),
    prisma.certificate.count({ where: { status: "FAILED" } }),
    prisma.recruiterProfile.count({ where: { status: "PENDING" } }),
    prisma.job.count({ where: { approvalStatus: "PENDING" } }),
    prisma.user.findMany({ where: { role: "ADMIN" }, select: { name: true, email: true } }),
  ]);

  const revenue =
    coursePurchases.reduce((sum, p) => sum + netAmount(p.amount, p.creditApplied), 0) +
    eventRegistrations.reduce((sum, r) => sum + netAmount(r.amount, r.creditApplied), 0) +
    competitionEntries.reduce((sum, e) => sum + netAmount(e.amount, e.creditApplied), 0);

  const stats = {
    newStudents,
    revenue,
    newCoursePurchases: coursePurchases.length,
    newEventRegistrations: eventRegistrations.length,
    newCompetitionEntries: competitionEntries.length,
    pendingColleges,
    failedCertificates,
    pendingRecruiters,
    pendingJobs,
  };

  let sent = 0;
  for (const admin of admins) {
    const ok = await sendAdminDigestEmail(admin.email, admin.name, stats);
    if (ok) sent++;
  }

  return NextResponse.json({ ...stats, adminsNotified: sent });
}
