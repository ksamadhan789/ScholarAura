import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Avatar";
import { FREELANCE_REPORT_REASONS, isFreelanceReportReason } from "@/lib/freelanceReportReasons";
import { DismissReportButton, ListingModerationButton } from "./FreelanceReportActions";
import { ExternalLink, Flag } from "lucide-react";
import { Badge } from "@/components/Badge";
import { DASHBOARD_CARD_CLASS, DashboardEmptyState, DashboardShell } from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default async function AdminFreelanceReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [openReports, removedListings] = await Promise.all([
    prisma.freelanceReport.findMany({
      where: { status: "OPEN" },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        listing: {
          select: {
            id: true,
            slug: true,
            title: true,
            postedByUser: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.freelanceListing.findMany({
      where: { removedByAdminAt: { not: null } },
      select: {
        id: true,
        slug: true,
        title: true,
        removedByAdminAt: true,
        postedByUser: { select: { name: true } },
      },
      orderBy: { removedByAdminAt: "desc" },
    }),
  ]);

  // Group open reports by listing, so several people flagging the same
  // listing show up as one card the admin decides on once.
  const byListing = new Map<
    string,
    { listing: (typeof openReports)[number]["listing"]; reports: typeof openReports }
  >();
  for (const r of openReports) {
    const group = byListing.get(r.listing.id) ?? { listing: r.listing, reports: [] };
    group.reports.push(r);
    byListing.set(r.listing.id, group);
  }

  return (
    <DashboardShell
      title="Reported freelance listings"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description="Freelance listings publish without approval, so user reports land here. Remove listing hides it, closes its open reports and stops the owner republishing it; Dismiss closes one report and leaves the listing up."
    >
      {byListing.size === 0 ? (
        <DashboardEmptyState icon={Flag} title="No open reports" text="You're all caught up." />
      ) : (
        <ul className="space-y-4">
          {Array.from(byListing.values()).map(({ listing, reports }) => (
            <li key={listing.id} className={`${DASHBOARD_CARD_CLASS} p-5`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/freelance/${listing.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                    >
                      {listing.title}
                      <ExternalLink aria-hidden className="h-4 w-4 text-slate-400" />
                    </Link>
                    <Badge variant="warning">
                      {reports.length} open report{reports.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    by {listing.postedByUser.name} · {listing.postedByUser.email}
                  </p>
                </div>
                <ListingModerationButton listingId={listing.id} action="remove" />
              </div>

              <ul className="mt-4 space-y-3">
                {reports.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-start sm:justify-between dark:bg-slate-900/40"
                  >
                    <div className="flex min-w-0 gap-3">
                      <Avatar name={r.reporter.name} src={`/api/admin/users/${r.reporter.id}/photo`} size={32} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {isFreelanceReportReason(r.reason) ? FREELANCE_REPORT_REASONS[r.reason] : r.reason}
                        </p>
                        {r.details && (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                            {r.details}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">
                          Reported by {r.reporter.name} ({r.reporter.email}) on {formatDate(r.createdAt)}
                        </p>
                      </div>
                    </div>
                    <DismissReportButton reportId={r.id} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {removedListings.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Removed listings</h2>
          <ul className="space-y-2">
            {removedListings.map((l) => (
              <li
                key={l.id}
                className={`${DASHBOARD_CARD_CLASS} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}
              >
                <p className="text-sm">
                  <span className="font-medium text-slate-900 dark:text-white">{l.title}</span>{" "}
                  <span className="text-slate-500 dark:text-slate-400">
                    by {l.postedByUser.name} · removed {l.removedByAdminAt ? formatDate(l.removedByAdminAt) : ""}
                  </span>
                </p>
                <ListingModerationButton listingId={l.id} action="restore" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </DashboardShell>
  );
}
