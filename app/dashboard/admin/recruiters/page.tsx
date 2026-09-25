import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Building2, ExternalLink, Mail, UserCheck } from "lucide-react";
import type { RecruiterStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  DASHBOARD_CARD_CLASS,
  DashboardEmptyState,
  DashboardShell,
  DashboardTabs,
} from "@/components/dashboard/DashboardShell";
import { isHttpUrl } from "@/lib/safeUrl";
import { RecruiterApprovalActions } from "./RecruiterApprovalActions";

const STATUS_BADGE: Record<RecruiterStatus, { label: string; variant: "success" | "warning" | "neutral" }> = {
  APPROVED: { label: "Approved", variant: "success" },
  PENDING: { label: "Pending review", variant: "warning" },
  REJECTED: { label: "Rejected", variant: "neutral" },
};

const TABS: { key: string; label: string; status?: RecruiterStatus }[] = [
  { key: "pending", label: "Pending", status: "PENDING" },
  { key: "approved", label: "Approved", status: "APPROVED" },
  { key: "rejected", label: "Rejected", status: "REJECTED" },
  { key: "all", label: "All" },
];

const BASE = "/dashboard/admin/recruiters";

export default async function AdminRecruitersPage({ searchParams }: { searchParams: { page?: string; tab?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const page = Math.max(1, Number(searchParams.page) || 1);
  const tab = TABS.find((t) => t.key === searchParams.tab) ?? TABS[0];
  const where = tab.status ? { status: tab.status } : {};

  const [recruiters, totalCount, statusCounts] = await Promise.all([
    prisma.recruiterProfile.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.recruiterProfile.count({ where }),
    prisma.recruiterProfile.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countFor = (status?: RecruiterStatus) =>
    statusCounts.filter((c) => !status || c.status === status).reduce((sum, c) => sum + c._count._all, 0);

  return (
    <DashboardShell
      title="Recruiter accounts"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description="Approve a recruiter before they can post jobs. Rejecting also removes their access to applicants."
    >
      <DashboardTabs
        active={tab.key}
        tabs={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          count: countFor(t.status),
          href: t.key === "pending" ? BASE : `${BASE}?tab=${t.key}`,
        }))}
      />

      {recruiters.length === 0 ? (
        <DashboardEmptyState
          icon={UserCheck}
          title={tab.key === "pending" ? "No recruiters waiting for review" : "No recruiter accounts here"}
        />
      ) : (
        <ul className="space-y-4">
          {recruiters.map((r) => {
            const status = STATUS_BADGE[r.status];
            return (
              <li
                key={r.id}
                className={`${DASHBOARD_CARD_CLASS} flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between`}
              >
                <div className="flex min-w-0 gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-sky-500 text-lg font-bold text-white">
                    {r.companyName.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">{r.companyName}</p>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                      {r.user.name}
                      {r.designation && <span className="text-slate-400"> · {r.designation}</span>}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                      <a
                        href={`mailto:${r.user.email}`}
                        className="inline-flex items-center gap-1.5 hover:text-brand-700 dark:hover:text-brand-400"
                      >
                        <Mail aria-hidden className="h-4 w-4" />
                        {r.user.email}
                      </a>
                      {r.companyWebsite && isHttpUrl(r.companyWebsite) ? (
                        <a
                          href={r.companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-1.5 text-brand-600 hover:underline dark:text-brand-400"
                        >
                          <ExternalLink aria-hidden className="h-4 w-4" />
                          {r.companyWebsite.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 aria-hidden className="h-4 w-4" />
                          No website given
                        </span>
                      )}
                      <span>
                        Signed up{" "}
                        {r.createdAt.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Asia/Kolkata",
                        })}
                      </span>
                    </div>
                    {r.status === "REJECTED" && r.rejectionReason && (
                      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
                        Reason given: {r.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
                {r.status === "PENDING" && <RecruiterApprovalActions recruiterId={r.id} />}
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={page}
        totalCount={totalCount}
        basePath={BASE}
        searchParams={{ tab: tab.key === "pending" ? undefined : tab.key }}
      />
    </DashboardShell>
  );
}
