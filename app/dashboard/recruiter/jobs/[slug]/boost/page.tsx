import Link from "next/link";
import { getServerSession } from "next-auth";
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
    <main className="mx-auto max-w-xl px-4 py-16">
      <Link
        href="/dashboard/recruiter"
        className="text-sm text-gray-500 hover:underline dark:text-slate-400"
      >
        ← My jobs
      </Link>
      <h1 className="mt-2 mb-2 text-2xl font-semibold">Boost {job.title}</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-slate-400">
        Pin this listing to the top of /jobs with a Featured badge for {JOB_BOOST_DURATION_DAYS}{" "}
        days.
      </p>

      {isFeatured && (
        <p className="mb-6 rounded bg-green-100 dark:bg-green-900/40 px-4 py-2.5 text-sm text-green-800 dark:text-green-300">
          ⭐ Currently featured until {formatJobDate(job.featuredUntil!)}. Boosting again extends
          the window.
        </p>
      )}

      {!job.isPublished || job.approvalStatus !== "APPROVED" ? (
        <p className="rounded bg-amber-100 dark:bg-amber-900/40 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
          This listing needs to be live (approved and published) before it can be boosted.
        </p>
      ) : (
        <BoostJobButton
          slug={job.slug}
          priceInr={JOB_BOOST_PRICE_INR}
          rates={serializedRates}
          userName={session.user.name}
          userEmail={session.user.email}
        />
      )}
    </main>
  );
}
