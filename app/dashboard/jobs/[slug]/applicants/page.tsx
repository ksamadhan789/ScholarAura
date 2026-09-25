import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApplicantsBoard } from "@/components/jobs/ApplicantsBoard";

export default async function JobApplicantsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job) notFound();

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
      basePath={`/dashboard/jobs/${job.slug}/applicants`}
      backHref="/dashboard/jobs"
      backLabel="Jobs"
    />
  );
}
