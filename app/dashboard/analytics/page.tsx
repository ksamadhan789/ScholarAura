import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getIstMonthKey } from "@/lib/istDate";
import { Award, BookOpen, CalendarDays, Percent, Share2, Tag, Trophy, UserPlus, type LucideIcon } from "lucide-react";
import { DASHBOARD_CARD_CLASS, DashboardShell, DashboardStatCard } from "@/components/dashboard/DashboardShell";

const CERT_STATUS_LABELS: Record<string, string> = {
  NOT_ELIGIBLE: "Not eligible",
  ELIGIBLE: "Eligible",
  PROCESSING: "Processing",
  GENERATED: "Generated",
  AVAILABLE: "Available",
  REVOKED: "Revoked",
  FAILED: "Failed",
};

function TopList({
  title,
  icon: Icon,
  items,
  empty,
  unit,
}: {
  title: string;
  icon: LucideIcon;
  items: { title: string; count: number; revenue: number }[];
  empty: string;
  unit: string;
}) {
  return (
    <section className={`${DASHBOARD_CARD_CLASS} p-5`}>
      <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
        <Icon aria-hidden className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{empty}</p>
      ) : (
        <ol className="mt-3 space-y-1 text-sm">
          {items.map((item, i) => (
            <li
              key={item.title}
              className="flex items-center gap-3 rounded-lg px-2 py-2 odd:bg-slate-50 dark:odd:bg-slate-900/30"
            >
              <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-slate-800 dark:text-slate-200">{item.title}</span>
              <span className="shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
                <span className="block font-semibold text-slate-900 dark:text-white">
                  ₹{item.revenue.toLocaleString("en-IN")}
                </span>
                {item.count} {unit}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function netAmount(amount: unknown, creditApplied: unknown): number {
  return Number(amount) - Number(creditApplied);
}

function monthKey(date: Date): string {
  return getIstMonthKey(date);
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    coursePurchases,
    eventRegistrations,
    competitionEntries,
    topCourseGroups,
    topEventGroups,
    topCompetitionGroups,
    couponAgg,
    courseDiscountAgg,
    eventDiscountAgg,
    competitionDiscountAgg,
    certificatesByStatus,
    newUsersLast30Days,
    referredUserCount,
  ] = await Promise.all([
    prisma.coursePurchase.findMany({
      where: { status: "SUCCESS", purchasedAt: { gte: sixMonthsAgo } },
      select: { purchasedAt: true, amount: true, creditApplied: true },
    }),
    prisma.eventRegistration.findMany({
      where: { status: "CONFIRMED", registeredAt: { gte: sixMonthsAgo } },
      select: { registeredAt: true, amount: true, creditApplied: true },
    }),
    prisma.competitionEntry.findMany({
      where: { status: "SUCCESS", registeredAt: { gte: sixMonthsAgo } },
      select: { registeredAt: true, amount: true, creditApplied: true },
    }),
    prisma.coursePurchase.groupBy({
      by: ["courseId"],
      where: { status: "SUCCESS" },
      _sum: { amount: true, creditApplied: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
    prisma.eventRegistration.groupBy({
      by: ["eventId"],
      where: { status: "CONFIRMED" },
      _sum: { amount: true, creditApplied: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
    prisma.competitionEntry.groupBy({
      by: ["competitionId"],
      where: { status: "SUCCESS" },
      _sum: { amount: true, creditApplied: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
    prisma.coupon.aggregate({ _sum: { redemptionCount: true }, _count: { _all: true } }),
    prisma.coursePurchase.aggregate({ where: { status: "SUCCESS" }, _sum: { discountAmount: true } }),
    prisma.eventRegistration.aggregate({ where: { status: "CONFIRMED" }, _sum: { discountAmount: true } }),
    prisma.competitionEntry.aggregate({ where: { status: "SUCCESS" }, _sum: { discountAmount: true } }),
    prisma.certificate.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.count({
      where: { role: "STUDENT", createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.user.count({ where: { referredById: { not: null } } }),
  ]);

  // Bucket the last 6 months of successful revenue by calendar month.
  const months: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    months.push(monthKey(d));
  }
  const revenueByMonth = new Map(months.map((m) => [m, 0]));
  for (const p of coursePurchases) {
    const key = monthKey(p.purchasedAt);
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + netAmount(p.amount, p.creditApplied));
  }
  for (const r of eventRegistrations) {
    const key = monthKey(r.registeredAt);
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + netAmount(r.amount, r.creditApplied));
  }
  for (const e of competitionEntries) {
    const key = monthKey(e.registeredAt);
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + netAmount(e.amount, e.creditApplied));
  }
  const maxMonthlyRevenue = Math.max(1, ...Array.from(revenueByMonth.values()));

  const [courses, events, competitions] = await Promise.all([
    prisma.course.findMany({
      where: { id: { in: topCourseGroups.map((g) => g.courseId) } },
      select: { id: true, title: true },
    }),
    prisma.event.findMany({
      where: { id: { in: topEventGroups.map((g) => g.eventId) } },
      select: { id: true, title: true },
    }),
    prisma.competition.findMany({
      where: { id: { in: topCompetitionGroups.map((g) => g.competitionId) } },
      select: { id: true, title: true },
    }),
  ]);
  const courseTitleById = new Map(courses.map((c) => [c.id, c.title]));
  const eventTitleById = new Map(events.map((e) => [e.id, e.title]));
  const competitionTitleById = new Map(competitions.map((c) => [c.id, c.title]));

  const topCourses = topCourseGroups.map((g) => ({
    title: courseTitleById.get(g.courseId) ?? "Deleted course",
    count: g._count._all,
    revenue: netAmount(g._sum.amount ?? 0, g._sum.creditApplied ?? 0),
  }));
  const topEvents = topEventGroups.map((g) => ({
    title: eventTitleById.get(g.eventId) ?? "Deleted event",
    count: g._count._all,
    revenue: netAmount(g._sum.amount ?? 0, g._sum.creditApplied ?? 0),
  }));
  const topCompetitions = topCompetitionGroups.map((g) => ({
    title: competitionTitleById.get(g.competitionId) ?? "Deleted competition",
    count: g._count._all,
    revenue: netAmount(g._sum.amount ?? 0, g._sum.creditApplied ?? 0),
  }));

  const totalDiscountGiven =
    Number(courseDiscountAgg._sum.discountAmount ?? 0) +
    Number(eventDiscountAgg._sum.discountAmount ?? 0) +
    Number(competitionDiscountAgg._sum.discountAmount ?? 0);

  const certStatusCount = new Map(certificatesByStatus.map((c) => [c.status, c._count._all]));

  const sixMonthRevenue = months.reduce((sum, m) => sum + (revenueByMonth.get(m) ?? 0), 0);

  return (
    <DashboardShell
      title="Analytics"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description="Revenue is what buyers actually paid — price minus any referral credit used."
    >
      <section className={`${DASHBOARD_CARD_CLASS} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-slate-900 dark:text-white">Revenue, last 6 months</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              ₹{sixMonthRevenue.toLocaleString("en-IN")}
            </span>
          </p>
        </div>
        <div className="mt-5 flex items-end gap-2 sm:gap-4" style={{ height: "12rem" }}>
          {months.map((m) => {
            const value = revenueByMonth.get(m) ?? 0;
            const heightPercent = Math.round((value / maxMonthlyRevenue) * 100);
            return (
              <div key={m} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                <span className="max-w-full truncate text-[10px] tabular-nums text-slate-500 sm:text-[11px] dark:text-slate-400">
                  ₹{value.toLocaleString("en-IN")}
                </span>
                <div
                  className="w-full max-w-16 rounded-t-lg bg-gradient-to-t from-brand-600 to-sky-400"
                  style={{ height: `${Math.max(heightPercent, 2)}%` }}
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{monthLabel(m)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardStatCard icon={UserPlus} value={newUsersLast30Days} label="New students (30 days)" />
        <DashboardStatCard
          href="/dashboard/affiliates"
          icon={Share2}
          value={referredUserCount}
          label="Referred users"
        />
        <DashboardStatCard
          href="/dashboard/coupons"
          icon={Tag}
          value={couponAgg._sum.redemptionCount ?? 0}
          label="Coupon redemptions"
        />
        <DashboardStatCard
          icon={Percent}
          value={`₹${totalDiscountGiven.toLocaleString("en-IN")}`}
          label="Discount given"
        />
      </section>

      <section className={`${DASHBOARD_CARD_CLASS} mt-6 p-5`}>
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <Award aria-hidden className="h-4 w-4 text-amber-500" />
          Certificates, by status
        </h2>
        {certStatusCount.size === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No certificates yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from(certStatusCount.entries()).map(([status, count]) => (
              <span
                key={status}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 dark:bg-slate-700 dark:text-slate-200"
              >
                {CERT_STATUS_LABELS[status] ?? status}
                <span className="font-bold tabular-nums">{count.toLocaleString("en-IN")}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TopList title="Top courses" icon={BookOpen} items={topCourses} empty="No sales yet." unit="sold" />
        <TopList
          title="Top events"
          icon={CalendarDays}
          items={topEvents}
          empty="No registrations yet."
          unit="registered"
        />
        <TopList
          title="Top competitions"
          icon={Trophy}
          items={topCompetitions}
          empty="No entries yet."
          unit="entries"
        />
      </div>
    </DashboardShell>
  );
}
