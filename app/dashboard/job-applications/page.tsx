import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Briefcase, Check, MapPin, MessageCircle } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EMPLOYMENT_TYPE_LABELS, formatJobDate } from "@/lib/jobLabels";
import { Badge } from "@/components/Badge";
import { WithdrawApplicationButton } from "@/components/WithdrawApplicationButton";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DashboardEmptyState,
  DashboardShell,
} from "@/components/dashboard/DashboardShell";

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "neutral" | "brand" }> = {
  APPLIED: { label: "Applied", variant: "brand" },
  SHORTLISTED: { label: "Shortlisted", variant: "success" },
  REJECTED: { label: "Not selected", variant: "neutral" },
  HIRED: { label: "Hired", variant: "success" },
};

/** Applied → Shortlisted → Hired; a rejected application stops where it was. */
const STEPS = ["APPLIED", "SHORTLISTED", "HIRED"] as const;

function StatusTrack({ status }: { status: string }) {
  if (status === "REJECTED") return null;
  const reached = STEPS.indexOf(status as (typeof STEPS)[number]);
  return (
    <ol className="mt-4 flex items-center gap-1.5 text-xs sm:gap-2" aria-label="Application progress">
      {STEPS.map((step, i) => {
        const done = i <= reached;
        return (
          <li key={step} className="flex items-center gap-1.5 sm:gap-2">
            {i > 0 && (
              <span
                aria-hidden
                className={`h-px w-3 sm:w-10 ${done ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-700"}`}
              />
            )}
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                done ? "text-brand-700 dark:text-brand-300" : "text-slate-400"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full ${
                  done ? "bg-brand-600 text-white" : "border border-slate-300 dark:border-slate-600"
                }`}
              >
                {done && <Check aria-hidden className="h-3 w-3" />}
              </span>
              {STATUS_BADGE[step].label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default async function MyJobApplicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const applications = await prisma.jobApplication.findMany({
    where: { userId: session.user.id },
    include: { job: true },
    orderBy: { appliedAt: "desc" },
  });
  const shortlisted = applications.filter((a) => a.status === "SHORTLISTED" || a.status === "HIRED").length;

  return (
    <DashboardShell
      title="My applications"
      description={
        applications.length > 0
          ? `${applications.length} ${applications.length === 1 ? "application" : "applications"} · ${shortlisted} shortlisted or hired`
          : "Jobs and internships you apply to show up here, with their status."
      }
      actions={
        applications.length > 0 && (
          <Link href="/jobs" className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
            <Briefcase aria-hidden className="h-4 w-4" />
            Browse jobs
          </Link>
        )
      }
    >
      {applications.length === 0 ? (
        <DashboardEmptyState
          icon={Briefcase}
          title="You haven't applied to a job yet"
          text="Browse academic and professional jobs and internships — apply with your resume in a couple of clicks."
          href="/jobs"
          cta="Browse jobs"
        />
      ) : (
        <ul className="space-y-4">
          {applications.map((app) => {
            const status = STATUS_BADGE[app.status] ?? { label: app.status, variant: "neutral" as const };
            return (
              <li key={app.id} className={`${DASHBOARD_CARD_CLASS} p-5`}>
                <div className="flex gap-4">
                  {app.job.companyLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={app.job.companyLogoUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg border border-slate-100 bg-white object-contain p-1 dark:border-slate-700"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-sky-500 text-lg font-bold text-white"
                    >
                      {app.job.companyName.trim().charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/jobs/${app.job.slug}`}
                          className="font-semibold leading-snug text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                        >
                          {app.job.title}
                        </Link>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{app.job.companyName}</p>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin aria-hidden className="h-4 w-4 shrink-0" />
                        {app.job.location}
                      </span>
                      <span>{EMPLOYMENT_TYPE_LABELS[app.job.employmentType]}</span>
                      <span>Applied {formatJobDate(app.appliedAt)}</span>
                    </div>
                  </div>
                </div>
                <StatusTrack status={app.status} />

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                  <Link
                    href={`/dashboard/job-applications/${app.id}/messages`}
                    className={DASHBOARD_SECONDARY_BUTTON_CLASS}
                  >
                    <MessageCircle aria-hidden className="h-4 w-4" />
                    Messages
                  </Link>
                  {app.status !== "HIRED" && (
                    <span className="ml-auto">
                      <WithdrawApplicationButton jobSlug={app.job.slug} />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
}
