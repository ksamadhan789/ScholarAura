import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Avatar";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/Badge";
import { DashboardEmptyState, DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function FreelanceMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const threads = await prisma.freelanceThread.findMany({
    where: {
      OR: [{ initiatorId: session.user.id }, { listing: { postedByUserId: session.user.id } }],
    },
    include: {
      listing: {
        select: {
          title: true,
          slug: true,
          postedByUserId: true,
          postedByUser: { select: { name: true, photoFileId: true } },
        },
      },
      initiator: { select: { id: true, name: true, photoFileId: true } },
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
    <DashboardShell narrow title="Freelance messages" backHref="/dashboard/freelance" backLabel="My listings">
      {sorted.length === 0 ? (
        <DashboardEmptyState
          icon={MessageCircle}
          title="No conversations yet"
          text="Message a freelancer from their listing, or wait for someone to reach out about one of yours."
          href="/freelance"
          cta="Browse freelance"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((thread) => {
            const isOwner = thread.listing.postedByUserId === session.user.id;
            const otherPartyId = isOwner ? thread.initiator.id : thread.listing.postedByUserId;
            const otherPartyName = isOwner ? thread.initiator.name : thread.listing.postedByUser.name;
            const otherPartyPhotoFileId = isOwner
              ? thread.initiator.photoFileId
              : thread.listing.postedByUser.photoFileId;
            const lastMessage = thread.messages[0];
            return (
              <Link
                key={thread.id}
                href={`/dashboard/freelance/messages/${thread.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-slate-900 dark:text-white">{thread.listing.title}</h2>
                  <Badge variant={isOwner ? "brand" : "neutral"}>{isOwner ? "Inbound" : "You reached out"}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Avatar
                    name={otherPartyName}
                    src={
                      otherPartyPhotoFileId
                        ? `/api/freelance/threads/${thread.id}/messages/photo?userId=${otherPartyId}`
                        : null
                    }
                    size={20}
                  />
                  with {otherPartyName}
                </div>
                {lastMessage && (
                  <p className="mt-2 truncate text-sm text-slate-600 dark:text-slate-300">{lastMessage.body}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
