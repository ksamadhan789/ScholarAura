import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "@/components/jobs/MessageThread";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function MyApplicationMessagesPage({ params }: { params: { applicationId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const application = await prisma.jobApplication.findUnique({
    where: { id: params.applicationId },
    include: { job: true },
  });
  if (!application || application.userId !== session.user.id) {
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
      backHref="/dashboard/job-applications"
      backLabel="My applications"
      title={`Messages · ${application.job.title}`}
      description={`With the recruiter at ${application.job.companyName}`}
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
