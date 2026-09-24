import Link from "next/link";
import { ShareButtons } from "@/components/ShareButtons";
import { SITE_URL } from "@/lib/siteUrl";
import { buildJobPostingSchema, serializeJsonLd } from "@/lib/jobPostingSchema";
import { Briefcase, Building2, CalendarDays, Clock, MapPin } from "lucide-react";
import { ActionCard, ActionStatus, ACTION_PRIMARY_CLASS, DetailColumns } from "@/components/detail/DetailLayout";
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

  // Google for Jobs structured data — null (so no tag) for drafts, pending
  // approval, and jobs past their application deadline.
  const jobPostingSchema = buildJobPostingSchema(job, SITE_URL);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 sm:py-16">
      {jobPostingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jobPostingSchema) }}
        />
      )}
      {!job.isPublished && (
        <p className="mb-4 inline-block rounded bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-sm text-amber-800 dark:text-amber-300">
          Draft — not visible to the public yet
        </p>
      )}

      <DetailHero
        eyebrow={EMPLOYMENT_TYPE_LABELS[job.employmentType]}
        badges={
          <>
            {isFeatured && <Badge variant="warning">Featured</Badge>}
            {urgency && <Badge variant={urgency.variant}>{urgency.label} to apply</Badge>}
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
                <Building2 aria-hidden className="h-4 w-4" />
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

      <DetailColumns
        aside={
          <ActionCard
            label={isInternship ? "Stipend" : "Salary"}
            price={
              (isInternship ? job.stipendRange : job.salaryRange) ?? (
                <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">Not disclosed</span>
              )
            }
            priceNote={job.applicationDeadline && `Apply by ${formatJobDate(job.applicationDeadline)}`}
            footer={
              <>
                <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <MapPin aria-hidden className="h-4 w-4" />
                  {job.isRemote ? "Remote" : formatJobLocation(job)}
                </p>
                {isInternship ? (
                  <>
                    {job.durationMonths && (
                      <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Clock aria-hidden className="h-4 w-4" />
                        {job.durationMonths} month{job.durationMonths === 1 ? "" : "s"}
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <CalendarDays aria-hidden className="h-4 w-4" />
                      Starts {job.internshipStartDate ? formatJobDate(job.internshipStartDate) : "immediately"}
                    </p>
                  </>
                ) : (
                  job.minExperienceYears != null && (
                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Briefcase aria-hidden className="h-4 w-4" />
                      {job.minExperienceYears}+ years experience
                    </p>
                  )
                )}
                {session && !application && (
                  <SaveButton endpoint={`/api/jobs/${job.slug}/wishlist`} isSaved={!!wishlistEntry} />
                )}
                {job.isPublished && (
                  <ShareButtons url={`${SITE_URL}/jobs/${job.slug}`} title={`${job.title} at ${job.companyName}`} />
                )}
              </>
            }
          >
            {application ? (
              <>
                <ActionStatus tone="success">You&apos;ve applied — status: {application.status}</ActionStatus>
                {application.status !== "HIRED" && <WithdrawApplicationButton jobSlug={job.slug} />}
              </>
            ) : !job.isPublished ? (
              <ActionStatus tone="neutral">Draft — applications open once published</ActionStatus>
            ) : deadlinePassed ? (
              <ActionStatus tone="neutral">Applications closed</ActionStatus>
            ) : session ? (
              <Link href={`/jobs/${job.slug}/apply`} className={ACTION_PRIMARY_CLASS}>
                Apply now
              </Link>
            ) : (
              <Link href={`/login?callbackUrl=/jobs/${job.slug}`} className={ACTION_PRIMARY_CLASS}>
                Log in to apply
              </Link>
            )}
            {isAdmin && (
              <Link
                href={`/dashboard/jobs/${job.slug}/edit`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium dark:border-slate-600"
              >
                Edit job
              </Link>
            )}
            {!isAdmin && session?.user.role === "RECRUITER" && session.user.id === job.postedByUserId && (
              <Link
                href={`/dashboard/recruiter/jobs/${job.slug}/edit`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium dark:border-slate-600"
              >
                Edit job
              </Link>
            )}
          </ActionCard>
        }
      >

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
      </DetailColumns>
    </main>
  );
}
