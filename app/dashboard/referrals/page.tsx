import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReferralCode, getReferralRatePercent } from "@/lib/referral";
import { getTopReferrersByCount, getTopReferrersByCredit } from "@/lib/referralLeaderboard";
import { SITE_URL } from "@/lib/siteUrl";
import { Avatar } from "@/components/Avatar";
import { CopyLinkButton } from "./CopyLinkButton";
import { Gift, TrendingUp, Trophy, Users, Wallet } from "lucide-react";
import { DASHBOARD_CARD_CLASS, DashboardShell, DashboardStatCard } from "@/components/dashboard/DashboardShell";
import type { LeaderboardEntry } from "@/lib/referralLeaderboard";

function LeaderboardTable({
  title,
  entries,
  currentUserId,
  formatValue,
}: {
  title: string;
  entries: LeaderboardEntry[];
  currentUserId: string;
  formatValue: (value: number) => string;
}) {
  return (
    <div className={`${DASHBOARD_CARD_CLASS} flex-1 p-5`}>
      <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No referrals yet.</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {entries.map((entry) => (
            <li
              key={entry.userId}
              className={`flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm ${
                entry.userId === currentUserId ? "bg-brand-50 font-semibold dark:bg-brand-900/20" : ""
              }`}
            >
              <span className="flex min-w-0 items-center gap-2 text-slate-700 dark:text-slate-200">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    entry.rank === 1
                      ? "bg-amber-400 text-amber-950"
                      : entry.rank === 2
                        ? "bg-slate-300 text-slate-800"
                        : entry.rank === 3
                          ? "bg-orange-300 text-orange-950"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {entry.rank}
                </span>
                <span className="truncate">
                  {entry.displayName}
                  {entry.userId === currentUserId ? " (you)" : ""}
                </span>
              </span>
              <span className="shrink-0 tabular-nums text-slate-900 dark:text-white">{formatValue(entry.value)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default async function ReferralsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    redirect("/login");
  }

  const [referrals, transactions, topByCount, topByCredit, earnedAgg] = await Promise.all([
    prisma.user.findMany({
      where: { referredById: user.id },
      select: { id: true, name: true, email: true, createdAt: true, photoFileId: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.creditTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    getTopReferrersByCount(10),
    getTopReferrersByCredit(10),
    prisma.creditTransaction.aggregate({ where: { userId: user.id, type: "EARNED" }, _sum: { amount: true } }),
  ]);

  // Accounts created before referral codes existed (or via a sign-up path
  // that doesn't assign one) get a code the first time they open this page,
  // instead of a broken "?ref=null" link.
  let referralCode = user.referralCode;
  if (!referralCode) {
    referralCode = await generateReferralCode();
    await prisma.user.update({ where: { id: user.id }, data: { referralCode } });
  }
  const referralLink = `${SITE_URL}/register?ref=${referralCode}`;
  const ratePercent = getReferralRatePercent(user);

  const earnedTotal = Number(earnedAgg._sum.amount ?? 0);

  return (
    <DashboardShell
      title="Refer & earn"
      description="Invite friends to ScholarAura and earn credit you can spend here."
    >
      <section className="relative overflow-hidden rounded-3xl bg-navy-900 p-6 text-white sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl"
        />
        <div className="relative">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-sky-300">
            <Gift aria-hidden className="h-4 w-4" />
            {user.isAffiliate ? "Affiliate rate" : "Referral reward"}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Earn {ratePercent}% credit on every purchase your friends make
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Whenever someone who signed up with your link buys a course or registers for a paid event, you get{" "}
            {ratePercent}% of it as ScholarAura credit.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 truncate rounded-lg bg-white/10 px-3 py-2.5 text-sm text-white ring-1 ring-white/15">
              {referralLink}
            </code>
            <CopyLinkButton link={referralLink} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <DashboardStatCard icon={Wallet} value={`₹${Number(user.creditBalance).toFixed(2)}`} label="Credit balance" />
        <DashboardStatCard icon={Users} value={referrals.length} label="People invited" />
        <DashboardStatCard icon={TrendingUp} value={`₹${earnedTotal.toFixed(2)}`} label="Credit earned, all time" />
      </section>
      <p className="mt-2 text-xs text-slate-400">
        Credit is applied automatically toward your next course or event purchase.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">People you&apos;ve invited</h2>
          {referrals.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
              No one has signed up with your link yet — share it above.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {referrals.map((r) => (
                <li key={r.id} className={`${DASHBOARD_CARD_CLASS} flex items-center gap-3 p-3 text-sm`}>
                  <Avatar name={r.name} src={r.photoFileId ? `/api/referrals/${r.id}/photo` : null} size={36} />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">{r.name}</p>
                    <p className="truncate text-slate-500 dark:text-slate-400">
                      {r.email} · Joined{" "}
                      {r.createdAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "Asia/Kolkata",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Credit history</h2>
          {transactions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
              No credit activity yet.
            </p>
          ) : (
            <ul className={`${DASHBOARD_CARD_CLASS} divide-y divide-slate-100 dark:divide-slate-700`}>
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-slate-800 dark:text-slate-100">{t.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.createdAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "Asia/Kolkata",
                      })}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 font-semibold tabular-nums ${
                      t.type === "EARNED"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {t.type === "EARNED" ? "+" : "−"}₹{Number(t.amount).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <Trophy aria-hidden className="h-5 w-5 text-amber-500" />
          Leaderboard
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <LeaderboardTable
            title="Most referrals"
            entries={topByCount}
            currentUserId={user.id}
            formatValue={(v) => `${v} referral${v === 1 ? "" : "s"}`}
          />
          <LeaderboardTable
            title="Most credit earned"
            entries={topByCredit}
            currentUserId={user.id}
            formatValue={(v) => `₹${v.toFixed(2)}`}
          />
        </div>
      </section>
    </DashboardShell>
  );
}
