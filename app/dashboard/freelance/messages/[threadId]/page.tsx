import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "@/components/freelance/MessageThread";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function FreelanceThreadPage({ params }: { params: { threadId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const thread = await prisma.freelanceThread.findUnique({
    where: { id: params.threadId },
    include: {
      listing: { include: { postedByUser: { select: { id: true, name: true } } } },
      initiator: { select: { id: true, name: true } },
    },
  });

  const isInitiator = thread?.initiatorId === session.user.id;
  const isOwner = thread?.listing.postedByUserId === session.user.id;
  if (!thread || (!isInitiator && !isOwner)) {
    notFound();
  }

  const messages = await prisma.freelanceMessage.findMany({
    where: { threadId: thread.id },
    include: { sender: { select: { id: true, name: true, photoFileId: true } } },
    orderBy: { createdAt: "asc" },
  });

  const otherParty = isInitiator ? thread.listing.postedByUser.name : thread.initiator.name;

  return (
    <DashboardShell
      narrow
      title={thread.listing.title}
      description={
        <>
          with {otherParty} ·{" "}
          <Link
            href={`/freelance/${thread.listing.slug}`}
            className="font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            View listing
          </Link>
        </>
      }
      backHref="/dashboard/freelance/messages"
      backLabel="Messages"
    >
      <MessageThread
        threadId={thread.id}
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
