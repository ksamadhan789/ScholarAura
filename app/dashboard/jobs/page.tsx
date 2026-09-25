import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { Briefcase, Building2, MapPin, Pencil, Plus, Sparkles, Users } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EMPLOYMENT_TYPE_LABELS, formatPostedAgo } from "@/lib/jobLabels";
import { JobPublishToggle } from "./JobPublishToggle";
import { JobApprovalActions } from "./JobApprovalActions";
import { Badge } from "@/components/Badge";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_PRIMARY_BUTTON_CLASS,
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DashboardEmptyState,
  DashboardShell,
  DashboardTabs,
} from "@/components/dashboard/DashboardShell";

const TABS: { key: string; label: string; where: Prisma.JobWhereInput }[] = [
  { key: "all", label: "All", where: {} },
  { key: "pending", label: "Pending review", where: { approvalStatus: "PENDING" } },
  { key: "live", label: "Live", where: { approvalStatus: "APPROVED", isPublished: true } },
  { key: "unpublished", label: "Not published", where: { approvalStatus: "APPROVED", isPublished: false } },
  { key: "rejected", label: "Rejected", where: { approvalStatus: "REJECTED" } },
];

const BASE = "/dashboard/jobs";

export default async function ManageJobsPage({ searchParams }: { searchParams: { page?: string; tab?: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const page = Math.max(1, Number(searchParams.page) || 1);
  const tab = TABS.find((t) => t.key === searchParams.tab) ?? TABS[0];

  const [jobs, totalCount, applicationCounts, tabCounts] = await Promise.all([
    prisma.job.findMany({
      where: tab.where,
      include: { recruiterProfile: true },
      // Jobs waiting for review first, then newest.
      orderBy: [{ approvalStatus: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.job.count({ where: tab.where }),
    prisma.jobApplication.groupBy({ by: ["jobId"], _count: { _all: true } }),
    Promise.all(TABS.map((t) => prisma.job.count({ where: t.where }))),
  ]);
  const applicationCountByJobId = new Map(applicationCounts.map((a) => [a.jobId, a._count._all]));
  const now = new Date();

  return (
    <DashboardShell
      title="Manage jobs"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description="Jobs posted by the ScholarAura team and by recruiters. Recruiter jobs need approval before they go live."
      actions={
        <Link href="/dashboard/jobs/new" className={`${DASHBOARD_PRIMARY_BUTTON_CLASS} py-1.5`}>
          <Plus aria-hidden className="h-4 w-4" />
          New job
        </Link>
      }
    >
      <DashboardTabs
        active={tab.key}
        tabs={TABS.map((t, i) => ({
          key: t.key,
          label: t.label,
          count: tabCounts[i],
          href: t.key === "all" ? BASE : `${BASE}?tab=${t.key}`,
        }))}
      />

      {jobs.length === 0 ? (
        <DashboardEmptyState icon={Briefcase} title="No jobs here" />
      ) : (
        <ul className="space-y-4">
          {jobs.map((job) => {
            const applicants = applicationCountByJobId.get(job.id) ?? 0;
            const pending = job.approvalStatus === "PENDING";
            return (
              <li
                key={job.id}
                className={`${DASHBOARD_CARD_CLASS} p-5 ${pending ? "ring-1 ring-amber-200 dark:ring-amber-800" : ""}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {pending ? (
                        <Badge variant="warning">Pending review</Badge>
                      ) : job.approvalStatus === "REJECTED" ? (
                        <Badge variant="neutral">Rejected</Badge>
                      ) : (
                        <Badge variant={job.isPublished ? "success" : "neutral"}>
                          {job.isPublished ? "Live" : "Not published"}
                        </Badge>
                      )}
                      <Badge variant="brand">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
                      {job.featuredUntil && job.featuredUntil > now && <Badge variant="warning">Featured</Badge>}
                    </div>
                    <Link
                      href={`/jobs/${job.slug}`}
                      className="mt-1.5 block font-semibold leading-snug text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                    >
                      {job.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 aria-hidden className="h-4 w-4" />
                        {job.companyName}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin aria-hidden className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span>{formatPostedAgo(job.createdAt, now)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {job.recruiterProfile
                        ? `Posted by recruiter: ${job.recruiterProfile.companyName}`
                        : "Posted by the ScholarAura team"}
                    </p>
                    {job.approvalStatus === "REJECTED" && job.rejectionReason && (
                      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
                        Reason given: {job.rejectionReason}
                      </p>
                    )}
                  </div>
                  {pending && <JobApprovalActions slug={job.slug} />}
                </div>

                {!pending && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                    <Link href={`/dashboard/jobs/${job.slug}/applicants`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
                      <Users aria-hidden className="h-4 w-4" />
                      {applicants} {applicants === 1 ? "applicant" : "applicants"}
                    </Link>
                    <Link href={`/dashboard/jobs/${job.slug}/edit`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
                      <Pencil aria-hidden className="h-4 w-4" />
                      Edit
                    </Link>
                    {job.isPublished && (
                      <Link href={`/dashboard/jobs/${job.slug}/boost`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
                        <Sparkles aria-hidden className="h-4 w-4 text-amber-500" />
                        Boost
                      </Link>
                    )}
                    <span className="ml-auto">
                      <JobPublishToggle slug={job.slug} isPublished={job.isPublished} />
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={page}
        totalCount={totalCount}
        basePath={BASE}
        searchParams={{ tab: tab.key === "all" ? undefined : tab.key }}
      />
    </DashboardShell>
  );
}
