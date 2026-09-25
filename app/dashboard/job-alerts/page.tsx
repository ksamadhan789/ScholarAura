import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { describeJobAlert, jobAlertSearchPath } from "@/lib/jobAlertLabels";
import { MAX_ALERTS_PER_USER } from "@/lib/jobAlerts";
import { JobAlertActions } from "./JobAlertActions";
import { Bell, BellOff } from "lucide-react";
import { Badge } from "@/components/Badge";
import { DASHBOARD_CARD_CLASS, DashboardEmptyState, DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function JobAlertsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/dashboard/job-alerts");

  const alerts = await prisma.jobAlert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell
      narrow
      title="Job alerts"
      description={
        <>
          Once a day we email you new jobs matching each active alert — only when there&apos;s something new. Create an
          alert from any search on the{" "}
          <Link href="/jobs" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Jobs page
          </Link>{" "}
          (up to {MAX_ALERTS_PER_USER}).
        </>
      }
    >
      {alerts.length === 0 ? (
        <DashboardEmptyState
          icon={Bell}
          title="You don't have any job alerts yet"
          text="Search for jobs, then choose “Create job alert” to get new matches by email."
          href="/jobs"
          cta="Search jobs"
        />
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`${DASHBOARD_CARD_CLASS} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}
            >
              <div className="flex min-w-0 gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    alert.isActive
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-700"
                  }`}
                >
                  {alert.isActive ? (
                    <Bell aria-hidden className="h-5 w-5" />
                  ) : (
                    <BellOff aria-hidden className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0">
                  <Link
                    href={jobAlertSearchPath(alert)}
                    className="font-semibold text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                  >
                    {describeJobAlert(alert)}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Badge variant={alert.isActive ? "success" : "neutral"}>
                      {alert.isActive ? "Active" : "Paused"}
                    </Badge>
                    {alert.lastSentAt &&
                      `Last email ${alert.lastSentAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}`}
                  </p>
                </div>
              </div>
              <JobAlertActions id={alert.id} isActive={alert.isActive} />
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
