import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "@/components/jobs/MessageThread";

export default async function MyApplicationMessagesPage({
  params,
}: {
  params: { applicationId: string };
}) {
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
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Link
        href="/dashboard/job-applications"
        className="text-sm text-gray-500 hover:underline dark:text-slate-400"
      >
        ← My applications
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">
        Messages — {application.job.title} at {application.job.companyName}
      </h1>
      <MessageThread
        applicationId={application.id}
        currentUserId={session.user.id}
        initialMessages={messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.sender.name,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
