import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FreelanceListingActions } from "./FreelanceListingActions";
import { MessageCircle, Pencil, Plus, Store } from "lucide-react";
import { Badge } from "@/components/Badge";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_PRIMARY_BUTTON_CLASS,
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DashboardEmptyState,
  DashboardShell,
} from "@/components/dashboard/DashboardShell";

export default async function MyFreelanceListingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const listings = await prisma.freelanceListing.findMany({
    where: { postedByUserId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell
      title="My freelance listings"
      description="Your services listed on /freelance — visible to everyone while published."
      actions={
        <>
          <Link href="/dashboard/freelance/messages" className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
            <MessageCircle aria-hidden className="h-4 w-4" />
            Messages
          </Link>
          <Link href="/dashboard/freelance/new" className={`${DASHBOARD_PRIMARY_BUTTON_CLASS} py-1.5`}>
            <Plus aria-hidden className="h-4 w-4" />
            New listing
          </Link>
        </>
      }
    >
      {listings.length === 0 ? (
        <DashboardEmptyState
          icon={Store}
          title="You haven't posted any services yet"
          text="List what you offer (for example tutoring, design or writing) and people can message you directly."
          href="/dashboard/freelance/new"
          cta="Post your services"
        />
      ) : (
        <ul className="space-y-3">
          {listings.map((listing) => (
            <li
              key={listing.id}
              className={`${DASHBOARD_CARD_CLASS} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/freelance/${listing.slug}`}
                    className="font-semibold text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                  >
                    {listing.title}
                  </Link>
                  {listing.removedByAdminAt ? (
                    <Badge variant="neutral">Removed by admin</Badge>
                  ) : (
                    <Badge variant={listing.isPublished ? "success" : "warning"}>
                      {listing.isPublished ? "Published" : "Paused"}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{listing.category}</p>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                <Link href={`/dashboard/freelance/${listing.slug}/edit`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
                  <Pencil aria-hidden className="h-4 w-4" />
                  Edit
                </Link>
                <FreelanceListingActions
                  slug={listing.slug}
                  isPublished={listing.isPublished}
                  removedByAdmin={!!listing.removedByAdminAt}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
