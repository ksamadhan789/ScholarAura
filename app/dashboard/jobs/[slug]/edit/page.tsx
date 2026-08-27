import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditJobForm } from "./EditJobForm";

function toDateInput(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export default async function EditJobPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job) notFound();

  return (
    <EditJobForm
      slug={job.slug}
      initial={{
        title: job.title,
        companyName: job.companyName,
        companyLogoUrl: job.companyLogoUrl ?? "",
        location: job.location,
        isRemote: job.isRemote,
        employmentType: job.employmentType,
        description: job.description,
        requirements: job.requirements ?? "",
        minExperienceYears: job.minExperienceYears?.toString() ?? "",
        salaryRange: job.salaryRange ?? "",
        applicationDeadline: toDateInput(job.applicationDeadline),
      }}
    />
  );
}
