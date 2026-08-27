import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/jobLabels";
import { JobPublishToggle } from "./JobPublishToggle";
import { Badge } from "@/components/Badge";

export default async function ManageJobsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [jobs, applicationCounts] = await Promise.all([
    prisma.job.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.jobApplication.groupBy({ by: ["jobId"], _count: { _all: true } }),
  ]);
  const applicationCountByJobId = new Map(applicationCounts.map((a) => [a.jobId, a._count._all]));

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage jobs</h1>
        <Link
          href="/dashboard/jobs/new"
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white"
        >
          + New job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">No jobs posted yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-4"
            >
              <div>
                <Link href={`/jobs/${job.slug}`} className="font-medium hover:underline">
                  {job.title}
                </Link>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {job.companyName} · {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                  <Badge variant={job.isPublished ? "success" : "warning"}>
                    {job.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <span>{applicationCountByJobId.get(job.id) ?? 0} applicants</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/jobs/${job.slug}/edit`}
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  Edit
                </Link>
                <Link
                  href={`/dashboard/jobs/${job.slug}/applicants`}
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  Applicants
                </Link>
                <JobPublishToggle slug={job.slug} isPublished={job.isPublished} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
