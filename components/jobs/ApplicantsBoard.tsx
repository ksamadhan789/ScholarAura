import Link from "next/link";
import { Download, ExternalLink, FileText, Mail, MessageCircle, Users } from "lucide-react";
import type { JobApplicationStatus } from "@prisma/client";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_PRIMARY_BUTTON_CLASS,
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DashboardEmptyState,
  DashboardShell,
  DashboardTabs,
} from "@/components/dashboard/DashboardShell";
import { ApplicationStatusSelect } from "@/app/dashboard/jobs/[slug]/applicants/ApplicationStatusSelect";
import { formatJobDate } from "@/lib/jobLabels";
import { isHttpUrl } from "@/lib/safeUrl";

export type BoardApplicant = {
  id: string;
  status: JobApplicationStatus;
  appliedAt: Date;
  coverNote: string | null;
  user: {
    name: string;
    email: string;
    photoFileId: string | null;
    organization: string | null;
    fieldOfStudy: string | null;
    jobRole: string | null;
    expertise: string | null;
    linkedinUrl: string | null;
    achievements: unknown;
  };
};

const TABS: { key: string; label: string; status?: JobApplicationStatus }[] = [
  { key: "all", label: "All" },
  { key: "applied", label: "To review", status: "APPLIED" },
  { key: "shortlisted", label: "Shortlisted", status: "SHORTLISTED" },
  { key: "hired", label: "Hired", status: "HIRED" },
  { key: "rejected", label: "Not selected", status: "REJECTED" },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The applicants list for one job — shared by the recruiter's and the
 * admin's applicants pages, which differ only in links and back target.
 * Shows what the applicant put on their profile (headline, expertise,
 * LinkedIn, achievements) next to the resume and cover note.
 */
export function ApplicantsBoard({
  job,
  applications,
  tab,
  basePath,
  backHref,
  backLabel,
}: {
  job: { slug: string; title: string; companyName: string };
  applications: BoardApplicant[];
  tab: string | undefined;
  /** e.g. /dashboard/recruiter/jobs/<slug>/applicants — tabs and message links hang off it. */
  basePath: string;
  backHref: string;
  backLabel: string;
}) {
  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0];
  const visible = activeTab.status ? applications.filter((a) => a.status === activeTab.status) : applications;
  const now = Date.now();

  return (
    <DashboardShell
      title="Applicants"
      backHref={backHref}
      backLabel={backLabel}
      description={
        <>
          <Link href={`/jobs/${job.slug}`} className="font-medium text-slate-700 hover:underline dark:text-slate-200">
            {job.title}
          </Link>{" "}
          · {job.companyName} · {applications.length} {applications.length === 1 ? "applicant" : "applicants"}
        </>
      }
      actions={
        <>
          <Link
            href={`/jobs/${job.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={DASHBOARD_SECONDARY_BUTTON_CLASS}
          >
            <ExternalLink aria-hidden className="h-4 w-4" />
            View listing
          </Link>
          {applications.length > 0 && (
            <a href={`/api/jobs/${job.slug}/applicants/export`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
              <Download aria-hidden className="h-4 w-4" />
              Export CSV
            </a>
          )}
        </>
      }
    >
      {applications.length === 0 ? (
        <DashboardEmptyState
          icon={Users}
          title="No applications yet"
          text="New applicants show up here, and you'll get a notification (the bell at the top) each time someone applies."
        />
      ) : (
        <>
          <DashboardTabs
            active={activeTab.key}
            tabs={TABS.map((t) => ({
              key: t.key,
              label: t.label,
              count: t.status ? applications.filter((a) => a.status === t.status).length : applications.length,
              href: t.key === "all" ? basePath : `${basePath}?tab=${t.key}`,
            }))}
          />

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
              No applicants with this status.
            </p>
          ) : (
            <ul className="space-y-4">
              {visible.map((app) => {
                const { user } = app;
                const headline = [user.fieldOfStudy ?? user.jobRole, user.organization].filter(Boolean).join(" · ");
                const achievements = Array.isArray(user.achievements)
                  ? (user.achievements as unknown[]).filter((a): a is string => typeof a === "string" && !!a.trim())
                  : [];
                const linkedin = user.linkedinUrl && isHttpUrl(user.linkedinUrl) ? user.linkedinUrl : null;
                const isNew = now - app.appliedAt.getTime() < WEEK_MS;

                return (
                  <li key={app.id} className={`${DASHBOARD_CARD_CLASS} p-5`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <Avatar
                          name={user.name}
                          src={user.photoFileId ? `/api/admin/job-applications/${app.id}/photo` : null}
                          size={56}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                            {isNew && <Badge variant="success">New</Badge>}
                          </div>
                          {headline && <p className="text-sm text-slate-600 dark:text-slate-300">{headline}</p>}
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                            <a
                              href={`mailto:${user.email}`}
                              className="inline-flex min-w-0 items-center gap-1.5 hover:text-brand-700 dark:hover:text-brand-400"
                            >
                              <Mail aria-hidden className="h-4 w-4 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </a>
                            <span>Applied {formatJobDate(app.appliedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <ApplicationStatusSelect applicationId={app.id} status={app.status} />
                      </div>
                    </div>

                    {(user.expertise || achievements.length > 0) && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {user.expertise && (
                          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                            Expert in {user.expertise}
                          </span>
                        )}
                        {achievements.slice(0, 5).map((a) => (
                          <span
                            key={a}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    )}

                    {app.coverNote && (
                      <blockquote className="mt-4 whitespace-pre-wrap rounded-xl border-l-4 border-brand-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-brand-800 dark:bg-slate-900/40 dark:text-slate-300">
                        {app.coverNote}
                      </blockquote>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                      <a
                        href={`/api/admin/job-applications/${app.id}/resume`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${DASHBOARD_PRIMARY_BUTTON_CLASS} py-1.5`}
                      >
                        <FileText aria-hidden className="h-4 w-4" />
                        View resume
                      </a>
                      <Link href={`${basePath}/${app.id}/messages`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
                        <MessageCircle aria-hidden className="h-4 w-4" />
                        Message
                      </Link>
                      {linkedin && (
                        <a
                          href={linkedin}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className={DASHBOARD_SECONDARY_BUTTON_CLASS}
                        >
                          <ExternalLink aria-hidden className="h-4 w-4" />
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </DashboardShell>
  );
}
