import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EMPLOYMENT_TYPE_LABELS, EMPLOYMENT_TYPE_TABS, formatJobDate } from "@/lib/jobLabels";
import { Briefcase, Clock, IndianRupee, MapPin } from "lucide-react";
import { Badge } from "@/components/Badge";
import { SaveButton } from "@/components/SaveButton";
import {
  EmptyState,
  FILTER_FIELD_CLASS,
  FilterActions,
  FilterGroup,
  FilterOption,
  FilterOptionList,
  FilterPanel,
  ListingHeader,
  ListingShell,
  ResultsSection,
} from "@/components/listing/ListingLayout";
import { readLocationCookie, getKnownCities } from "@/lib/location";
import { formatJobLocation } from "@/lib/jobCity";
import { jobSearchWhere, parseEmploymentType } from "@/lib/jobSearch";
import { JobAlertButton } from "@/components/jobs/JobAlertButton";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Job openings shared with the ScholarAura community.",
};

function JobCard({
  job,
  isSaved,
}: {
  job: {
    id: string;
    slug: string;
    title: string;
    companyName: string;
    companyLogoUrl: string | null;
    location: string;
    city: string | null;
    isRemote: boolean;
    employmentType: string;
    salaryRange: string | null;
    stipendRange: string | null;
    durationMonths: number | null;
    featuredUntil: Date | null;
    createdAt: Date;
  };
  isSaved: boolean | null;
}) {
  const isInternship = job.employmentType === "INTERNSHIP";
  const isFeatured = Boolean(job.featuredUntil && job.featuredUntil > new Date());
  const pay = isInternship ? job.stipendRange : job.salaryRange;
  return (
    <div className="relative">
      {isSaved !== null && (
        <div className="absolute right-3 top-3 z-10">
          <SaveButton endpoint={`/api/jobs/${job.slug}/wishlist`} isSaved={isSaved} variant="overlay" />
        </div>
      )}
      <Link
        href={`/jobs/${job.slug}`}
        className={`group flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 dark:bg-slate-800 ${
          isFeatured
            ? "border-amber-300 ring-1 ring-amber-200 dark:border-amber-700 dark:ring-amber-900"
            : "border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-700"
        }`}
      >
        {job.companyLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={job.companyLogoUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg border border-slate-100 bg-white object-contain p-1 dark:border-slate-700"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-slate-700 dark:text-brand-400">
            <Briefcase aria-hidden className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0 flex-1 pr-8">
          <div className="flex flex-wrap items-center gap-1.5">
            {isFeatured && <Badge variant="warning">Featured</Badge>}
            <Badge variant="brand">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
          </div>
          <h3 className="mt-1.5 font-semibold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
            {job.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{job.companyName}</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-1.5">
              <MapPin aria-hidden className="h-4 w-4 text-slate-400" />
              {job.isRemote ? "Remote" : formatJobLocation(job)}
            </li>
            {pay && (
              <li className="flex items-center gap-1.5">
                <IndianRupee aria-hidden className="h-4 w-4 text-slate-400" />
                {pay}
              </li>
            )}
            {isInternship && job.durationMonths && (
              <li className="flex items-center gap-1.5">
                <Clock aria-hidden className="h-4 w-4 text-slate-400" />
                {job.durationMonths} month{job.durationMonths === 1 ? "" : "s"}
              </li>
            )}
          </ul>
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">Posted {formatJobDate(job.createdAt)}</p>
        </div>
      </Link>
    </div>
  );
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { employmentType?: string; remote?: string; q?: string; city?: string };
}) {
  const session = await getServerSession(authOptions);
  const activeType = searchParams.employmentType;
  const remoteOnly = searchParams.remote === "true";
  const q = searchParams.q?.trim();
  // Same "present but empty means explicitly cleared" rule as /events —
  // only fall back to the saved location when the key is absent entirely.
  const activeCity = searchParams.city !== undefined ? searchParams.city || undefined : readLocationCookie();

  const [jobs, cities] = await Promise.all([
    prisma.job.findMany({
      where: {
        isPublished: true,
        ...jobSearchWhere({ query: q, employmentType: activeType, remoteOnly, city: activeCity }),
      },
      orderBy: { createdAt: "desc" },
    }),
    getKnownCities(),
  ]);

  const savedJobIds = session
    ? new Set(
        (
          await prisma.jobWishlist.findMany({
            where: { userId: session.user.id, jobId: { in: jobs.map((j) => j.id) } },
            select: { jobId: true },
          })
        ).map((w) => w.jobId)
      )
    : null;

  // Prisma can't express "featured jobs first, then by date" in one
  // orderBy, so split and concatenate — same pattern as the ongoing/
  // upcoming split on /events.
  const now = new Date();
  const featuredJobs = jobs.filter((j) => j.featuredUntil && j.featuredUntil > now);
  const regularJobs = jobs.filter((j) => !j.featuredUntil || j.featuredUntil <= now);

  const hasFilters = Boolean(q || activeCity || activeType || remoteOnly);

  return (
    <main>
      <ListingHeader
        title={activeType === "INTERNSHIP" ? "Internships" : "Jobs"}
        subtitle="Academic and professional openings from approved recruiters."
        action={
          <Link
            href="/recruiter/register"
            className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50 dark:border-slate-600 dark:bg-slate-800 dark:text-brand-300 dark:hover:bg-slate-700"
          >
            Hiring? Post a job
          </Link>
        }
      />

      <ListingShell
        sidebar={
          <FilterPanel action="/jobs">
            {activeType && <input type="hidden" name="employmentType" value={activeType} />}
            {remoteOnly && <input type="hidden" name="remote" value="true" />}
            <FilterGroup label="Search">
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Title, company or location…"
                className={FILTER_FIELD_CLASS}
              />
            </FilterGroup>
            <FilterGroup label="Job type">
              <FilterOptionList>
                <FilterOption href="/jobs" active={!activeType && !remoteOnly}>
                  All jobs
                </FilterOption>
                {EMPLOYMENT_TYPE_TABS.map(({ type, label }) => (
                  <FilterOption key={type} href={`/jobs?employmentType=${type}`} active={activeType === type}>
                    {label}
                  </FilterOption>
                ))}
                <FilterOption href="/jobs?remote=true" active={remoteOnly}>
                  Remote
                </FilterOption>
              </FilterOptionList>
            </FilterGroup>
            <FilterGroup label="Location">
              <select name="city" defaultValue={activeCity ?? ""} className={FILTER_FIELD_CLASS}>
                <option value="">Any location</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </FilterGroup>
            <FilterActions clearHref={hasFilters ? "/jobs" : undefined} />
          </FilterPanel>
        }
        sidebarFooter={
          <JobAlertButton
            isLoggedIn={!!session}
            returnPath={`/jobs?${new URLSearchParams(
              Object.entries(searchParams).filter((e): e is [string, string] => typeof e[1] === "string")
            ).toString()}`}
            filters={{
              query: q ?? null,
              employmentType: parseEmploymentType(activeType),
              remoteOnly,
              city: activeCity ?? null,
            }}
          />
        }
      >
        {jobs.length === 0 ? (
          <EmptyState
            title="No jobs match right now"
            text={hasFilters ? "Try removing a filter or searching for something else." : "New roles are posted regularly — check back soon."}
          />
        ) : (
          <div className="flex flex-col gap-8">
            {featuredJobs.length > 0 && (
              <ResultsSection title="Featured" count={featuredJobs.length}>
                <div className="flex flex-col gap-3">
                  {featuredJobs.map((job) => (
                    <JobCard key={job.slug} job={job} isSaved={savedJobIds ? savedJobIds.has(job.id) : null} />
                  ))}
                </div>
              </ResultsSection>
            )}

            {regularJobs.length > 0 && (
              <ResultsSection title={featuredJobs.length > 0 ? "All jobs" : `${regularJobs.length} open role${regularJobs.length === 1 ? "" : "s"}`}>
                <div className="flex flex-col gap-3">
                  {regularJobs.map((job) => (
                    <JobCard key={job.slug} job={job} isSaved={savedJobIds ? savedJobIds.has(job.id) : null} />
                  ))}
                </div>
              </ResultsSection>
            )}
          </div>
        )}
      </ListingShell>
    </main>
  );
}
