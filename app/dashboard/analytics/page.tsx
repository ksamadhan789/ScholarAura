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

function netAmount(amount: unknown, creditApplied: unknown): number {
  return Number(amount) - Number(creditApplied);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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
    prisma.course.findMany({ where: { id: { in: topCourseGroups.map((g) => g.courseId) } }, select: { id: true, title: true } }),
    prisma.event.findMany({ where: { id: { in: topEventGroups.map((g) => g.eventId) } }, select: { id: true, title: true } }),
    prisma.competition.findMany({ where: { id: { in: topCompetitionGroups.map((g) => g.competitionId) } }, select: { id: true, title: true } }),
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <Link href="/dashboard/admin" className="text-sm text-gray-500 hover:underline dark:text-slate-400">
        ← Admin
      </Link>
      <h1 className="mt-2 mb-8 text-2xl font-semibold">Analytics</h1>

      <section className="mb-10">
        <h2 className="mb-3 font-semibold">Revenue, last 6 months</h2>
        <div className="flex items-end gap-3 rounded border border-gray-200 dark:border-slate-700 p-4" style={{ height: "10rem" }}>
          {months.map((m) => {
            const value = revenueByMonth.get(m) ?? 0;
            const heightPercent = Math.round((value / maxMonthlyRevenue) * 100);
            return (
              <div key={m} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs text-gray-500 dark:text-slate-400">₹{value.toLocaleString("en-IN")}</span>
                <div
                  className="w-full rounded-t bg-brand-600"
                  style={{ height: `${Math.max(heightPercent, 2)}%` }}
                />
                <span className="text-xs text-gray-500 dark:text-slate-400">{monthLabel(m)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="New students (30d)" value={newUsersLast30Days.toLocaleString("en-IN")} />
        <StatTile label="Referred users" value={referredUserCount.toLocaleString("en-IN")} />
        <StatTile label="Coupon redemptions" value={(couponAgg._sum.redemptionCount ?? 0).toLocaleString("en-IN")} />
        <StatTile label="Discount given" value={`₹${totalDiscountGiven.toLocaleString("en-IN")}`} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-semibold">Certificates issued, by status</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from(certStatusCount.entries()).map(([status, count]) => (
            <StatTile key={status} label={status} value={count.toLocaleString("en-IN")} />
          ))}
        </div>
      </section>

      <div className="grid gap-8 sm:grid-cols-3">
        <section>
          <h2 className="mb-3 font-semibold">Top courses</h2>
          {topCourses.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400">No sales yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {topCourses.map((c) => (
                <li key={c.title} className="flex justify-between gap-2 rounded border border-gray-200 dark:border-slate-700 p-2.5">
                  <span className="truncate">{c.title}</span>
                  <span className="shrink-0 text-gray-500 dark:text-slate-400">
                    {c.count} · ₹{c.revenue.toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Top events</h2>
          {topEvents.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400">No registrations yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {topEvents.map((e) => (
                <li key={e.title} className="flex justify-between gap-2 rounded border border-gray-200 dark:border-slate-700 p-2.5">
                  <span className="truncate">{e.title}</span>
                  <span className="shrink-0 text-gray-500 dark:text-slate-400">
                    {e.count} · ₹{e.revenue.toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Top competitions</h2>
          {topCompetitions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400">No entries yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {topCompetitions.map((c) => (
                <li key={c.title} className="flex justify-between gap-2 rounded border border-gray-200 dark:border-slate-700 p-2.5">
                  <span className="truncate">{c.title}</span>
                  <span className="shrink-0 text-gray-500 dark:text-slate-400">
                    {c.count} · ₹{c.revenue.toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
