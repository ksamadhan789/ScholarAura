import { getServerSession } from "next-auth";
import { Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JOB_BOOST_PRICE_INR, JOB_BOOST_DURATION_DAYS } from "@/lib/jobBoost";
import { formatJobDate } from "@/lib/jobLabels";
import { BoostJobButton } from "@/components/jobs/BoostJobButton";

export default async function RecruiterBoostJobPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "RECRUITER") redirect("/dashboard");

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job || job.postedByUserId !== session.user.id) notFound();

  const isFeatured = Boolean(job.featuredUntil && job.featuredUntil > new Date());
  const rates = await prisma.exchangeRate.findMany({ orderBy: { currencyCode: "asc" } });
  const serializedRates = rates.map((r) => ({
    currencyCode: r.currencyCode,
    symbol: r.symbol,
    rateFromInr: r.rateFromInr.toString(),
  }));

  return (
    <DashboardShell
      narrow
      title={`Boost ${job.title}`}
      backHref="/dashboard/recruiter"
      backLabel="Recruiter dashboard"
      description={`Pin this listing to the top of /jobs with a Featured badge for ${JOB_BOOST_DURATION_DAYS} days.`}
    >
      {isFeatured && (
        <p className="mb-6 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
          <Sparkles aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          Currently featured until {formatJobDate(job.featuredUntil!)}. Boosting again extends the window.
        </p>
      )}

      {!job.isPublished || job.approvalStatus !== "APPROVED" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          This listing needs to be live (approved and published) before it can be boosted.
        </p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-800">
          <BoostJobButton
            slug={job.slug}
            priceInr={JOB_BOOST_PRICE_INR}
            rates={serializedRates}
            userName={session.user.name}
            userEmail={session.user.email}
          />
        </div>
      )}
    </DashboardShell>
  );
}
