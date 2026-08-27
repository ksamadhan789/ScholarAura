import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EMPLOYMENT_TYPE_LABELS, EMPLOYMENT_TYPE_TABS, formatJobDate } from "@/lib/jobLabels";
import { Badge } from "@/components/Badge";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Job openings shared with the ScholarAura community.",
};

function JobCard({
  job,
}: {
  job: {
    slug: string;
    title: string;
    companyName: string;
    companyLogoUrl: string | null;
    location: string;
    isRemote: boolean;
    employmentType: string;
    salaryRange: string | null;
    createdAt: Date;
  };
}) {
  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="flex items-start gap-4 rounded-lg border border-gray-200 dark:border-slate-700 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
    >
      {job.companyLogoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={job.companyLogoUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded object-contain"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-brand-50 text-xl dark:bg-slate-800">
          💼
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-slate-900 dark:text-white">{job.title}</h3>
        <p className="text-sm text-gray-600 dark:text-slate-400">{job.companyName}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
          <Badge variant="brand">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
          <span>{job.isRemote ? "Remote" : job.location}</span>
          {job.salaryRange && <span>· {job.salaryRange}</span>}
        </div>
        <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">
          Posted {formatJobDate(job.createdAt)}
        </p>
      </div>
    </Link>
  );
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { employmentType?: string; remote?: string; q?: string };
}) {
  const activeType = searchParams.employmentType;
  const remoteOnly = searchParams.remote === "true";
  const q = searchParams.q?.trim();

  const jobs = await prisma.job.findMany({
    where: {
      isPublished: true,
      ...(activeType ? { employmentType: activeType as never } : {}),
      ...(remoteOnly ? { isRemote: true } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { companyName: { contains: q, mode: "insensitive" } },
              { location: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">💼 Jobs</h1>
        <Link href="/recruiter/register" className="text-sm text-brand-600 underline dark:text-brand-400">
          Are you hiring? Post a job
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap gap-2" action="/jobs">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by title, company, or location..."
          className="min-w-[200px] flex-1 rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
        />
        <button
          type="submit"
          className="rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/jobs"
          className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
            !activeType && !remoteOnly
              ? "bg-brand-600 text-white"
              : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          ✨ All
        </Link>
        {EMPLOYMENT_TYPE_TABS.map(({ type, label }) => (
          <Link
            key={type}
            href={`/jobs?employmentType=${type}`}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              activeType === type
                ? "bg-brand-600 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/jobs?remote=true"
          className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
            remoteOnly
              ? "bg-brand-600 text-white"
              : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          🌐 Remote
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          👀 No jobs match right now — check back soon!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <JobCard key={job.slug} job={job} />
          ))}
        </div>
      )}
    </main>
  );
}
