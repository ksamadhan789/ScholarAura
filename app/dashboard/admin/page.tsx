import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-gray-200 dark:border-slate-700 p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [
    studentCount,
    onboardedCount,
    marketingOptInCount,
    collegeCount,
    pendingCollegeCount,
    publishedCourseCount,
    publishedEventCount,
    publishedCompetitionCount,
    courseRevenue,
    eventRevenue,
    competitionRevenue,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "STUDENT", onboardingCompletedAt: { not: null } } }),
    prisma.user.count({ where: { role: "STUDENT", marketingOptIn: true } }),
    prisma.college.count({ where: { status: "APPROVED" } }),
    prisma.college.count({ where: { status: "PENDING" } }),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.event.count({ where: { isPublished: true } }),
    prisma.competition.count({ where: { isPublished: true } }),
    prisma.coursePurchase.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true, creditApplied: true },
    }),
    prisma.eventRegistration.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amount: true, creditApplied: true },
    }),
    prisma.competitionEntry.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true, creditApplied: true },
    }),
  ]);

  // Actual money collected — gross price minus any credit applied. Doesn't
  // include chargedAmount for non-INR payments since that's just the same
  // INR amount billed in a different currency, not additional revenue.
  const totalRevenue =
    Number(courseRevenue._sum.amount ?? 0) -
    Number(courseRevenue._sum.creditApplied ?? 0) +
    Number(eventRevenue._sum.amount ?? 0) -
    Number(eventRevenue._sum.creditApplied ?? 0) +
    Number(competitionRevenue._sum.amount ?? 0) -
    Number(competitionRevenue._sum.creditApplied ?? 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-2 text-gray-600 dark:text-slate-400">
        Signed in as <strong>{session.user?.email}</strong>
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Students" value={studentCount.toLocaleString("en-IN")} />
        <StatTile label="Total revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} />
        <StatTile label="Published courses" value={publishedCourseCount.toLocaleString("en-IN")} />
        <StatTile label="Published events" value={publishedEventCount.toLocaleString("en-IN")} />
        <StatTile label="Published competitions" value={publishedCompetitionCount.toLocaleString("en-IN")} />
        <StatTile label="Onboarded" value={onboardedCount.toLocaleString("en-IN")} />
        <StatTile label="Opted into marketing" value={marketingOptInCount.toLocaleString("en-IN")} />
        <StatTile label="Colleges" value={collegeCount.toLocaleString("en-IN")} />
        <StatTile label="Pending colleges" value={pendingCollegeCount.toLocaleString("en-IN")} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard/analytics"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Analytics
        </Link>
        <Link
          href="/dashboard/courses"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Manage courses
        </Link>
        <Link
          href="/dashboard/events"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Manage events
        </Link>
        <Link
          href="/dashboard/competitions"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Manage competitions
        </Link>
        <Link
          href="/dashboard/students"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Students
        </Link>
        <Link
          href="/dashboard/colleges"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Review colleges
        </Link>
        <Link
          href="/dashboard/affiliates"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Manage affiliates
        </Link>
        <Link
          href="/dashboard/currencies"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Currency rates
        </Link>
        <Link
          href="/dashboard/coupons"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Coupons
        </Link>
        <Link
          href="/dashboard/external-courses"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Recommended courses
        </Link>
      </div>
    </main>
  );
}
