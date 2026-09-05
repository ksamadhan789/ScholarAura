import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JOB_APPLICATION_STATUS_LABELS, formatJobDate } from "@/lib/jobLabels";
import { Badge } from "@/components/Badge";
import { WithdrawApplicationButton } from "@/components/WithdrawApplicationButton";

const STATUS_BADGE_VARIANT: Record<string, "success" | "warning" | "neutral" | "brand"> = {
  APPLIED: "brand",
  SHORTLISTED: "success",
  REJECTED: "warning",
  HIRED: "success",
};

export default async function MyJobApplicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const applications = await prisma.jobApplication.findMany({
    where: { userId: session.user.id },
    include: { job: true },
    orderBy: { appliedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">My job applications</h1>

      {applications.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          You haven&rsquo;t applied to any jobs yet.{" "}
          <Link href="/jobs" className="text-brand-600 underline dark:text-brand-400">
            Browse jobs
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between gap-3 rounded border border-gray-200 dark:border-slate-700 p-4 hover:border-brand-300 dark:hover:border-brand-700"
            >
              <Link href={`/jobs/${app.job.slug}`} className="min-w-0 flex-1">
                <p className="font-medium">{app.job.title}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {app.job.companyName} · Applied {formatJobDate(app.appliedAt)}
                </p>
              </Link>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={STATUS_BADGE_VARIANT[app.status]}>
                  {JOB_APPLICATION_STATUS_LABELS[app.status]}
                </Badge>
                {app.status !== "HIRED" && <WithdrawApplicationButton jobSlug={app.job.slug} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
