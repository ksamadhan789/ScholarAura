import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "@/components/jobs/MessageThread";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { isActiveJobOwner } from "@/lib/jobOwnership";

export default async function RecruiterApplicationMessagesPage({
  params,
}: {
  params: { slug: string; applicationId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "RECRUITER") redirect("/dashboard");

  const application = await prisma.jobApplication.findUnique({
    where: { id: params.applicationId },
    include: { job: true, user: { select: { name: true } } },
  });
  // Same ownership rule as the applicants list: a recruiter whose account is
  // no longer approved loses access to their applicants' threads too.
  if (
    !application ||
    application.job.slug !== params.slug ||
    !(await isActiveJobOwner(session.user.id, application.job))
  ) {
    notFound();
  }

  const messages = await prisma.jobMessage.findMany({
    where: { applicationId: application.id },
    include: { sender: { select: { id: true, name: true, photoFileId: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardShell
      narrow
      backHref={`/dashboard/recruiter/jobs/${params.slug}/applicants`}
      backLabel="Applicants"
      title={`Messages with ${application.user.name}`}
      description={`About ${application.job.title}`}
    >
      <MessageThread
        applicationId={application.id}
        currentUserId={session.user.id}
        initialMessages={messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.sender.name,
          senderPhotoFileId: m.sender.photoFileId,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </DashboardShell>
  );
}
