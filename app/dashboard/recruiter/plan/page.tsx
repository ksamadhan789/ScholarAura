import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Check, CreditCard, Gift, Radio, ShieldCheck } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_TABLE_HEAD_CLASS,
  DASHBOARD_TABLE_WRAPPER_CLASS,
  DASHBOARD_TH_CLASS,
  DASHBOARD_TR_CLASS,
  DashboardShell,
  DashboardStatCard,
} from "@/components/dashboard/DashboardShell";
import { PlanCheckoutButton } from "@/components/recruiter/PlanCheckoutButton";
import {
  FREE_LIVE_JOB_LIMIT,
  PRO_INCLUDED_BOOSTS_PER_PERIOD,
  PRO_LIVE_JOB_LIMIT,
  PRO_PRICE_INR,
  getRecruiterPlanStatus,
} from "@/lib/recruiterPlan";
import { JOB_BOOST_PRICE_INR } from "@/lib/jobBoost";

const IST: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" };

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      <span>{children}</span>
    </li>
  );
}

export default async function RecruiterPlanPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/dashboard/recruiter/plan");
  if (session.user.role !== "RECRUITER") redirect("/dashboard");

  const recruiterProfile = await prisma.recruiterProfile.findUnique({ where: { userId: session.user.id } });
  if (!recruiterProfile || recruiterProfile.status !== "APPROVED") redirect("/dashboard/recruiter");

  const [status, payments] = await Promise.all([
    getRecruiterPlanStatus(session.user.id),
    prisma.recruiterSubscription.findMany({
      where: { userId: session.user.id, status: { in: ["SUCCESS", "REFUNDED"] } },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
  ]);
  const isPro = status.plan === "PRO";
  const usagePercent = Math.min(100, Math.round((status.liveJobCount / status.liveJobLimit) * 100));
  const yearlySaving = PRO_PRICE_INR.MONTHLY * 12 - PRO_PRICE_INR.YEARLY;

  return (
    <DashboardShell
      title="Your plan"
      description="Choose how many jobs you can have live at once. Plans are paid upfront and never renew automatically."
      backHref="/dashboard/recruiter"
      backLabel="Recruiter dashboard"
    >
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DashboardStatCard
          icon={CreditCard}
          value={isPro ? "Pro" : "Free"}
          label={
            isPro && status.proUntil ? `Until ${status.proUntil.toLocaleDateString("en-IN", IST)}` : "Current plan"
          }
        />
        <div className={`${DASHBOARD_CARD_CLASS} p-4`}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
              <Radio aria-hidden className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {status.liveJobCount} / {status.liveJobLimit}
              </span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">Live jobs (incl. in review)</span>
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className={`h-full rounded-full ${usagePercent >= 100 ? "bg-amber-500" : "bg-brand-600"}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
        <DashboardStatCard
          icon={Gift}
          value={isPro ? status.includedBoostsLeft : "—"}
          label={
            isPro
              ? status.includedBoostsLeft > 0
                ? "Included Boost available"
                : status.includedBoostsRenewAt
                  ? `Next Boost ${status.includedBoostsRenewAt.toLocaleDateString("en-IN", IST)}`
                  : "No included Boost this period"
              : "Included Boosts (Pro only)"
          }
        />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className={`${DASHBOARD_CARD_CLASS} flex flex-col p-6`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Free</h2>
            {!isPro && <Badge variant="brand">Your plan</Badge>}
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">₹0</p>
          <ul className="mt-5 flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
            <Feature>Up to {FREE_LIVE_JOB_LIMIT} live jobs at a time</Feature>
            <Feature>Applicant inbox, messages and CSV export</Feature>
            <Feature>Boost any job for ₹{JOB_BOOST_PRICE_INR} (30 days featured)</Feature>
          </ul>
        </div>

        <div className="relative flex flex-col rounded-2xl border-2 border-brand-500 bg-white p-6 shadow-md dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pro</h2>
            {isPro ? <Badge variant="success">Your plan</Badge> : <Badge variant="brand">Best for active hiring</Badge>}
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            ₹{PRO_PRICE_INR.MONTHLY}
            <span className="text-base font-medium text-slate-500 dark:text-slate-400"> / 30 days</span>
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            or ₹{PRO_PRICE_INR.YEARLY.toLocaleString("en-IN")} for a year — save ₹{yearlySaving.toLocaleString("en-IN")}
          </p>
          <ul className="mt-5 flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
            <Feature>Up to {PRO_LIVE_JOB_LIMIT} live jobs at a time</Feature>
            <Feature>
              {PRO_INCLUDED_BOOSTS_PER_PERIOD} free Boost every 30 days (worth ₹{JOB_BOOST_PRICE_INR})
            </Feature>
            <Feature>Everything in Free</Feature>
          </ul>
          <div className="mt-6 flex flex-col gap-3">
            <PlanCheckoutButton
              period="MONTHLY"
              priceInr={PRO_PRICE_INR.MONTHLY}
              label={isPro ? "Add 30 days" : "Get Pro for 30 days"}
              userName={session.user.name}
              userEmail={session.user.email}
            />
            <PlanCheckoutButton
              period="YEARLY"
              priceInr={PRO_PRICE_INR.YEARLY}
              label={isPro ? "Add 1 year" : "Get Pro for 1 year"}
              userName={session.user.name}
              userEmail={session.user.email}
              variant="secondary"
            />
          </div>
          <ul className="mt-4 flex flex-col gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <li className="flex items-center gap-1.5">
              <ShieldCheck aria-hidden className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              Secure payment by Razorpay
            </li>
            <li className="flex items-center gap-1.5">
              <Check aria-hidden className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              One-time payment — never charged again unless you renew
            </li>
            {isPro && (
              <li className="flex items-center gap-1.5">
                <Check aria-hidden className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                Renewing now adds time after your current plan ends — you don&apos;t lose any days
              </li>
            )}
          </ul>
        </div>
      </section>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        When Pro ends you go back to Free. Jobs that are already live stay live — you just can&apos;t publish new ones
        beyond the Free limit.
      </p>

      {payments.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Payment history</h2>
          <div className={DASHBOARD_TABLE_WRAPPER_CLASS}>
            <table className="w-full text-left text-sm">
              <thead className={DASHBOARD_TABLE_HEAD_CLASS}>
                <tr>
                  <th className={DASHBOARD_TH_CLASS}>Paid on</th>
                  <th className={DASHBOARD_TH_CLASS}>Plan</th>
                  <th className={DASHBOARD_TH_CLASS}>Covers</th>
                  <th className={DASHBOARD_TH_CLASS}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className={DASHBOARD_TR_CLASS}>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {p.createdAt.toLocaleDateString("en-IN", IST)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      Pro · {p.period === "YEARLY" ? "1 year" : "30 days"}
                      {p.status === "REFUNDED" && (
                        <span className="ml-2">
                          <Badge variant="neutral">Refunded</Badge>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {p.startsAt && p.endsAt
                        ? `${p.startsAt.toLocaleDateString("en-IN", IST)} – ${p.endsAt.toLocaleDateString("en-IN", IST)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-900 dark:text-white">
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
