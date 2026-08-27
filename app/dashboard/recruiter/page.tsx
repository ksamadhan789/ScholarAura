import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/jobLabels";
import { Badge } from "@/components/Badge";

const APPROVAL_BADGE_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "neutral",
};

export default async function RecruiterHomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "RECRUITER") redirect("/dashboard");

  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!recruiterProfile) redirect("/dashboard");

  if (recruiterProfile.status !== "APPROVED") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-2xl font-semibold">💼 Recruiter account</h1>
        {recruiterProfile.status === "PENDING" ? (
          <div className="mt-6 rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/40 p-4">
            <p className="font-medium text-amber-800 dark:text-amber-300">Under review</p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              We're reviewing your recruiter account. You'll be able to post jobs once it's
              approved — we'll email you either way.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/40 p-4">
            <p className="font-medium text-red-800 dark:text-red-300">Not approved</p>
            {recruiterProfile.rejectionReason && (
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                Reason: {recruiterProfile.rejectionReason}
              </p>
            )}
          </div>
        )}
      </main>
    );
  }

  const jobs = await prisma.job.findMany({
    where: { postedByUserId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const applicationCounts = jobs.length
    ? await prisma.jobApplication.groupBy({
        by: ["jobId"],
        where: { jobId: { in: jobs.map((j) => j.id) } },
        _count: { _all: true },
      })
    : [];
  const applicationCountByJobId = new Map(applicationCounts.map((a) => [a.jobId, a._count._all]));

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">💼 {recruiterProfile.companyName}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Recruiter dashboard</p>
        </div>
        <Link
          href="/dashboard/recruiter/jobs/new"
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white"
        >
          + New job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">You haven&rsquo;t posted any jobs yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-4"
            >
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                  <Badge variant={APPROVAL_BADGE_VARIANT[job.approvalStatus]}>
                    {job.approvalStatus === "APPROVED" && job.isPublished
                      ? "Live"
                      : job.approvalStatus === "APPROVED"
                        ? "Approved"
                        : job.approvalStatus === "PENDING"
                          ? "Pending review"
                          : "Changes needed"}
                  </Badge>
                  <span>{applicationCountByJobId.get(job.id) ?? 0} applicants</span>
                </div>
                {job.approvalStatus === "REJECTED" && job.rejectionReason && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {job.rejectionReason}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/recruiter/jobs/${job.slug}/edit`}
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  Edit
                </Link>
                <Link
                  href={`/dashboard/recruiter/jobs/${job.slug}/applicants`}
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  Applicants
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
