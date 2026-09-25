import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "@/components/jobs/MessageThread";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function AdminApplicationMessagesPage({
  params,
}: {
  params: { slug: string; applicationId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const application = await prisma.jobApplication.findUnique({
    where: { id: params.applicationId },
    include: { job: true, user: { select: { name: true } } },
  });
  if (!application || application.job.slug !== params.slug) {
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
      backHref={`/dashboard/jobs/${params.slug}/applicants`}
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
