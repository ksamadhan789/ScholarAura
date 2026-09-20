import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "@/components/freelance/MessageThread";

export default async function FreelanceThreadPage({
  params,
}: {
  params: { threadId: string };
}) {
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
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const otherParty = isInitiator ? thread.listing.postedByUser.name : thread.initiator.name;

  return (
    <main className="mx-auto max-w-[1050px] px-4 py-16">
      <Link
        href="/dashboard/freelance/messages"
        className="text-sm text-gray-500 hover:underline dark:text-slate-400"
      >
        ← My messages
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">
        <Link href={`/freelance/${thread.listing.slug}`} className="hover:underline">
          {thread.listing.title}
        </Link>
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">with {otherParty}</p>
      <MessageThread
        threadId={thread.id}
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
