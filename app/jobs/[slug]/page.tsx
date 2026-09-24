import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatJobLocation } from "@/lib/jobCity";
import { EMPLOYMENT_TYPE_LABELS, formatJobDate } from "@/lib/jobLabels";
import { getDeadlineUrgency } from "@/lib/eventLabels";
import { Badge } from "@/components/Badge";
import { WithdrawApplicationButton } from "@/components/WithdrawApplicationButton";
import { SaveButton } from "@/components/SaveButton";
import { DetailHero } from "@/components/DetailHero";
import { InfoCard } from "@/components/InfoCard";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const job = await prisma.job.findUnique({
    where: { slug: params.slug, isPublished: true },
    select: { title: true, companyName: true, description: true },
  });
  if (!job) return {};

  return {
    title: `${job.title} at ${job.companyName}`,
    description: job.description,
  };
}

export default async function JobDetailPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const job = await prisma.job.findUnique({ where: { slug: params.slug } });

  const isAdmin = session?.user.role === "ADMIN";
  if (!job || (!job.isPublished && !isAdmin)) {
    notFound();
  }

  const [application, wishlistEntry] = session
    ? await Promise.all([
        prisma.jobApplication.findUnique({
          where: { jobId_userId: { jobId: job.id, userId: session.user.id } },
        }),
        prisma.jobWishlist.findUnique({
          where: { userId_jobId: { userId: session.user.id, jobId: job.id } },
        }),
      ])
    : [null, null];

  const deadlinePassed = job.applicationDeadline ? new Date() > job.applicationDeadline : false;
  const isInternship = job.employmentType === "INTERNSHIP";
  const isFeatured = Boolean(job.featuredUntil && job.featuredUntil > new Date());
  const urgency = job.applicationDeadline ? getDeadlineUrgency(job.applicationDeadline) : null;

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 sm:py-16">
      {!job.isPublished && (
        <p className="mb-4 inline-block rounded bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-sm text-amber-800 dark:text-amber-300">
          Draft — not visible to the public yet
        </p>
      )}

      <DetailHero
        eyebrow={EMPLOYMENT_TYPE_LABELS[job.employmentType]}
        badges={
          <>
            {isFeatured && <Badge variant="warning">⭐ Featured</Badge>}
            {urgency && <Badge variant={urgency.variant}>⏰ {urgency.label} to apply</Badge>}
          </>
        }
        title={job.title}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              {job.companyLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.companyLogoUrl}
                  alt=""
                  className="h-5 w-5 rounded bg-white object-contain"
                />
              ) : (
                <span aria-hidden>💼</span>
              )}
              {job.companyName}
            </span>
            <span>{job.isRemote ? "Remote" : formatJobLocation(job)}</span>
            {isInternship ? (
              <>
                {job.stipendRange && <span>{job.stipendRange}</span>}
                {job.durationMonths && (
                  <span>
                    {job.durationMonths} month{job.durationMonths === 1 ? "" : "s"}
                  </span>
                )}
              </>
            ) : (
              <>
                {job.salaryRange && <span>{job.salaryRange}</span>}
                {job.minExperienceYears != null && <span>{job.minExperienceYears}+ yrs experience</span>}
              </>
            )}
          </>
        }
      />

      {job.applicationDeadline && (
        <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">
          Apply by {formatJobDate(job.applicationDeadline)}
        </p>
      )}

      {isInternship && (
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
          Start date:{" "}
          {job.internshipStartDate ? formatJobDate(job.internshipStartDate) : "Immediately"}
        </p>
      )}

      {isInternship && Array.isArray(job.perks) && job.perks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(job.perks as string[]).map((perk) => (
            <Badge key={perk} variant="neutral">
              {perk}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-6 whitespace-pre-wrap text-slate-800 dark:text-slate-200">
        {job.description}
      </div>

      {job.requirements && (
        <div className="mt-6">
          <InfoCard icon="📋" title="Requirements">
            <div className="whitespace-pre-wrap">{job.requirements}</div>
          </InfoCard>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
        {isAdmin && (
          <Link
            href={`/dashboard/jobs/${job.slug}/edit`}
            className="mr-3 rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
          >
            Edit
          </Link>
        )}
        {!isAdmin && session?.user.role === "RECRUITER" && session.user.id === job.postedByUserId && (
          <Link
            href={`/dashboard/recruiter/jobs/${job.slug}/edit`}
            className="mr-3 rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
          >
            Edit
          </Link>
        )}
        {application ? (
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="success">You've applied — status: {application.status}</Badge>
            {application.status !== "HIRED" && <WithdrawApplicationButton jobSlug={job.slug} />}
          </div>
        ) : !job.isPublished ? null : deadlinePassed ? (
          <Badge variant="warning">Applications closed</Badge>
        ) : session ? (
          <Link
            href={`/jobs/${job.slug}/apply`}
            className="rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
          >
            Apply now
          </Link>
        ) : (
          <Link
            href={`/login?callbackUrl=/jobs/${job.slug}`}
            className="rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
          >
            Log in to apply
          </Link>
        )}
      </div>

      {session && !application && (
        <div className="mt-4">
          <SaveButton endpoint={`/api/jobs/${job.slug}/wishlist`} isSaved={!!wishlistEntry} />
        </div>
      )}
    </main>
  );
}
