import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isActiveJobOwner } from "@/lib/jobOwnership";
import { ApplicantsBoard } from "@/components/jobs/ApplicantsBoard";

export default async function RecruiterJobApplicantsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "RECRUITER") redirect("/dashboard");

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job || !(await isActiveJobOwner(session.user.id, job))) notFound();

  const applications = await prisma.jobApplication.findMany({
    where: { jobId: job.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          photoFileId: true,
          organization: true,
          fieldOfStudy: true,
          jobRole: true,
          expertise: true,
          linkedinUrl: true,
          achievements: true,
        },
      },
    },
    orderBy: { appliedAt: "desc" },
  });

  return (
    <ApplicantsBoard
      job={job}
      applications={applications}
      tab={searchParams.tab}
      basePath={`/dashboard/recruiter/jobs/${job.slug}/applicants`}
      backHref="/dashboard/recruiter"
      backLabel="Recruiter dashboard"
    />
  );
}
