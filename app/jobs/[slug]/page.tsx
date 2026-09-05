import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EMPLOYMENT_TYPE_LABELS, formatJobDate } from "@/lib/jobLabels";
import { Badge } from "@/components/Badge";
import { WithdrawApplicationButton } from "@/components/WithdrawApplicationButton";

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

  const application = session
    ? await prisma.jobApplication.findUnique({
        where: { jobId_userId: { jobId: job.id, userId: session.user.id } },
      })
    : null;

  const deadlinePassed = job.applicationDeadline ? new Date() > job.applicationDeadline : false;

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      {!job.isPublished && (
        <p className="mb-4 inline-block rounded bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-sm text-amber-800 dark:text-amber-300">
          Draft — not visible to the public yet
        </p>
      )}

      <div className="flex items-start gap-4">
        {job.companyLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={job.companyLogoUrl} alt="" className="h-14 w-14 rounded object-contain" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-brand-50 text-2xl dark:bg-slate-800">
            💼
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold">{job.title}</h1>
          <p className="text-gray-600 dark:text-slate-400">{job.companyName}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
        <Badge variant="brand">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
        <span>{job.isRemote ? "Remote" : job.location}</span>
        {job.salaryRange && <span>· {job.salaryRange}</span>}
        {job.minExperienceYears != null && <span>· {job.minExperienceYears}+ yrs experience</span>}
      </div>

      {job.applicationDeadline && (
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
          Apply by {formatJobDate(job.applicationDeadline)}
        </p>
      )}

      <div className="mt-6 whitespace-pre-wrap text-slate-800 dark:text-slate-200">
        {job.description}
      </div>

      {job.requirements && (
        <div className="mt-6">
          <h2 className="mb-2 font-semibold">Requirements</h2>
          <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200">
            {job.requirements}
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-gray-200 dark:border-slate-700 pt-6">
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
    </main>
  );
}
