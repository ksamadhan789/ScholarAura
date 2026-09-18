import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function FreelanceMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const threads = await prisma.freelanceThread.findMany({
    where: {
      OR: [{ initiatorId: session.user.id }, { listing: { postedByUserId: session.user.id } }],
    },
    include: {
      listing: {
        select: { title: true, slug: true, postedByUserId: true, postedByUser: { select: { name: true } } },
      },
      initiator: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // Most recent activity first — last message if there is one, else when the thread started.
  const sorted = [...threads].sort((a, b) => {
    const aTime = (a.messages[0]?.createdAt ?? a.createdAt).getTime();
    const bTime = (b.messages[0]?.createdAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">💬 My messages</h1>

      {sorted.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          No conversations yet. Message a freelancer from their listing, or wait for someone to
          reach out about one of yours.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((thread) => {
            const isOwner = thread.listing.postedByUserId === session.user.id;
            const otherParty = isOwner ? thread.initiator.name : thread.listing.postedByUser.name;
            const lastMessage = thread.messages[0];
            return (
              <Link
                key={thread.id}
                href={`/dashboard/freelance/messages/${thread.id}`}
                className="block rounded-lg border border-gray-200 dark:border-slate-700 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-medium text-slate-900 dark:text-white">{thread.listing.title}</h2>
                  <span className="shrink-0 text-xs text-gray-400 dark:text-slate-500">
                    {isOwner ? "Inbound" : "You reached out"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">with {otherParty}</p>
                {lastMessage && (
                  <p className="mt-2 truncate text-sm text-gray-600 dark:text-slate-300">
                    {lastMessage.body}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
