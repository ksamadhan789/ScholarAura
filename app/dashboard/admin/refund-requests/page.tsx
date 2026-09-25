import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BookOpen, CalendarDays, Mail, RotateCcw, Trophy } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DASHBOARD_CARD_CLASS, DashboardEmptyState, DashboardShell } from "@/components/dashboard/DashboardShell";
import { RefundRequestActions } from "./RefundRequestActions";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AdminRefundRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const requests = await prisma.refundRequest.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { name: true, email: true } },
      coursePurchase: { include: { course: { select: { title: true, slug: true } } } },
      eventRegistration: { include: { event: { select: { title: true, slug: true } } } },
      competitionEntry: { include: { competition: { select: { title: true, slug: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
  const now = Date.now();

  return (
    <DashboardShell
      title="Refund requests"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description={
        <>
          Oldest first. Approving issues the refund immediately (same as the manual refund button on the purchase) and
          emails the student. Policy:{" "}
          <Link href="/refund-policy" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            /refund-policy
          </Link>
          .
        </>
      }
    >
      {requests.length === 0 ? (
        <DashboardEmptyState icon={RotateCcw} title="No pending refund requests" text="You're all caught up." />
      ) : (
        <ul className="space-y-4">
          {requests.map((r) => {
            const item = r.coursePurchase
              ? {
                  kind: "Course",
                  icon: BookOpen,
                  title: r.coursePurchase.course.title,
                  href: `/courses/${r.coursePurchase.course.slug}`,
                  amount: r.coursePurchase.amount,
                  paidAt: r.coursePurchase.purchasedAt,
                }
              : r.eventRegistration
                ? {
                    kind: "Event",
                    icon: CalendarDays,
                    title: r.eventRegistration.event.title,
                    href: `/events/${r.eventRegistration.event.slug}`,
                    amount: r.eventRegistration.amount,
                    paidAt: r.eventRegistration.registeredAt,
                  }
                : {
                    kind: "Competition",
                    icon: Trophy,
                    title: r.competitionEntry!.competition.title,
                    href: `/competitions/${r.competitionEntry!.competition.slug}`,
                    amount: r.competitionEntry!.amount,
                    paidAt: r.competitionEntry!.registeredAt,
                  };
            const daysWaiting = Math.floor((now - r.createdAt.getTime()) / DAY_MS);
            const daysSincePayment = Math.floor((r.createdAt.getTime() - item.paidAt.getTime()) / DAY_MS);
            const Icon = item.icon;

            return (
              <li
                key={r.id}
                className={`${DASHBOARD_CARD_CLASS} flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between`}
              >
                <div className="flex min-w-0 gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    <Icon aria-hidden className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                      {item.kind}
                    </p>
                    <Link
                      href={item.href}
                      className="font-semibold text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        ₹{Number(item.amount).toLocaleString("en-IN")}
                      </span>
                      <span>{r.user.name}</span>
                      <a
                        href={`mailto:${r.user.email}`}
                        className="inline-flex items-center gap-1.5 hover:text-brand-700 dark:hover:text-brand-400"
                      >
                        <Mail aria-hidden className="h-4 w-4" />
                        {r.user.email}
                      </a>
                    </div>
                    <blockquote className="mt-3 whitespace-pre-wrap rounded-xl border-l-4 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
                      {r.reason}
                    </blockquote>
                    <p className="mt-2 text-xs text-slate-400">
                      Requested{" "}
                      {daysSincePayment <= 0 ? "on the day of payment" : `${daysSincePayment} days after payment`} ·
                      waiting{" "}
                      {daysWaiting <= 0 ? "since today" : `${daysWaiting} ${daysWaiting === 1 ? "day" : "days"}`}
                    </p>
                  </div>
                </div>
                <RefundRequestActions requestId={r.id} />
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
}
