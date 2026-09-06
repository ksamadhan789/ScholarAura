import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "@/components/jobs/MessageThread";

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
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Link
        href={`/dashboard/jobs/${params.slug}/applicants`}
        className="text-sm text-gray-500 hover:underline dark:text-slate-400"
      >
        ← Applicants
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Messages with {application.user.name}</h1>
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
