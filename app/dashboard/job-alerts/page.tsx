import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { describeJobAlert, jobAlertSearchPath } from "@/lib/jobAlertLabels";
import { MAX_ALERTS_PER_USER } from "@/lib/jobAlerts";
import { JobAlertActions } from "./JobAlertActions";

export default async function JobAlertsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/dashboard/job-alerts");

  const alerts = await prisma.jobAlert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-[900px] px-4 py-16">
      <h1 className="text-2xl font-semibold">Job alerts</h1>
      <p className="mt-1 mb-8 text-sm text-slate-600 dark:text-slate-400">
        Once a day we email you new jobs matching each active alert — only when there&apos;s something
        new. Create an alert from any search on the{" "}
        <Link href="/jobs" className="text-brand-600 underline dark:text-brand-400">
          Jobs page
        </Link>{" "}
        (up to {MAX_ALERTS_PER_USER}).
      </p>

      {alerts.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">You don&apos;t have any job alerts yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div>
                <Link
                  href={jobAlertSearchPath(alert)}
                  className="font-medium text-slate-900 hover:text-brand-600 dark:text-white"
                >
                  {describeJobAlert(alert)}
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {alert.isActive ? "Active" : "Paused"}
                  {alert.lastSentAt &&
                    ` · last email ${alert.lastSentAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                </p>
              </div>
              <JobAlertActions id={alert.id} isActive={alert.isActive} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
