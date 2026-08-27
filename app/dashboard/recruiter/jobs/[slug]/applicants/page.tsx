import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatJobDate } from "@/lib/jobLabels";
import { ApplicationStatusSelect } from "@/app/dashboard/jobs/[slug]/applicants/ApplicationStatusSelect";

export default async function RecruiterJobApplicantsPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "RECRUITER") redirect("/dashboard");

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job || job.postedByUserId !== session.user.id) notFound();

  const applications = await prisma.jobApplication.findMany({
    where: { jobId: job.id },
    include: { user: true },
    orderBy: { appliedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Applicants for {job.title}</h1>

      {applications.length === 0 ? (
        <p className="mt-8 text-gray-500 dark:text-slate-400">No applications yet.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded border border-gray-200 dark:border-slate-700 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{app.user.name}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{app.user.email}</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                    Applied {formatJobDate(app.appliedAt)}
                  </p>
                </div>
                <ApplicationStatusSelect applicationId={app.id} status={app.status} />
              </div>
              {app.coverNote && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                  {app.coverNote}
                </p>
              )}
              <a
                href={`/api/admin/job-applications/${app.id}/resume`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-brand-600 underline dark:text-brand-400"
              >
                View resume
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
