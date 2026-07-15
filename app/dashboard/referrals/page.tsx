import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReferralRatePercent } from "@/lib/referral";
import { CopyLinkButton } from "./CopyLinkButton";

export default async function ReferralsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    redirect("/login");
  }

  const [referrals, transactions] = await Promise.all([
    prisma.user.findMany({
      where: { referredById: user.id },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.creditTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const referralLink = `${baseUrl}/register?ref=${user.referralCode}`;
  const ratePercent = getReferralRatePercent(user);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-semibold">Refer & earn</h1>

      <div className="rounded border border-gray-200 dark:border-slate-700 p-5">
        <p className="text-sm text-gray-500 dark:text-slate-400">Your referral link</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="rounded bg-gray-100 dark:bg-slate-700 px-3 py-2 text-sm">{referralLink}</code>
          <CopyLinkButton link={referralLink} />
        </div>
        <p className="mt-3 text-sm text-gray-600 dark:text-slate-400">
          {user.isAffiliate ? "Affiliate rate" : "Referral reward"}: you earn{" "}
          <strong>{ratePercent}%</strong> credit whenever someone you invite buys a course
          or registers for a paid event.
        </p>
      </div>

      <div className="mt-6 rounded border border-gray-200 dark:border-slate-700 p-5">
        <p className="text-sm text-gray-500 dark:text-slate-400">Your credit balance</p>
        <p className="mt-1 text-2xl font-semibold">
          ₹{Number(user.creditBalance).toFixed(2)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Applied automatically toward your next course or event purchase.
        </p>
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-medium">People you&apos;ve invited</h2>
        {referrals.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">No one has signed up with your link yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {referrals.map((r) => (
              <div key={r.id} className="rounded border border-gray-200 dark:border-slate-700 p-3 text-sm">
                <p className="font-medium">{r.name}</p>
                <p className="text-gray-500 dark:text-slate-400">
                  {r.email} · Joined{" "}
                  {r.createdAt.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-medium">Credit history</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">No credit activity yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-3 text-sm"
              >
                <div>
                  <p>{t.description}</p>
                  <p className="text-gray-500 dark:text-slate-400">
                    {t.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <p
                  className={
                    t.type === "EARNED" ? "font-medium text-green-700" : "font-medium text-gray-600 dark:text-slate-400"
                  }
                >
                  {t.type === "EARNED" ? "+" : "-"}₹{Number(t.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
