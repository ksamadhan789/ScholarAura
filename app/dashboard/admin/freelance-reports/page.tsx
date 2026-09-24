import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Avatar";
import { FREELANCE_REPORT_REASONS, isFreelanceReportReason } from "@/lib/freelanceReportReasons";
import { DismissReportButton, ListingModerationButton } from "./FreelanceReportActions";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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
  const byListing = new Map<string, { listing: (typeof openReports)[number]["listing"]; reports: typeof openReports }>();
  for (const r of openReports) {
    const group = byListing.get(r.listing.id) ?? { listing: r.listing, reports: [] };
    group.reports.push(r);
    byListing.set(r.listing.id, group);
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Reported freelance listings</h1>
      <p className="mb-8 text-sm text-gray-600 dark:text-slate-400">
        Freelance listings publish without approval, so this is where reports from users land.
        &ldquo;Remove listing&rdquo; hides it, closes all its open reports, and stops the owner from
        republishing it; &ldquo;Dismiss&rdquo; closes one report and leaves the listing up.
      </p>

      {byListing.size === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">No open reports.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from(byListing.values()).map(({ listing, reports }) => (
            <div key={listing.id} className="rounded border border-gray-200 dark:border-slate-700 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/freelance/${listing.slug}`}
                    target="_blank"
                    className="font-medium text-brand-600 underline dark:text-brand-400"
                  >
                    {listing.title} ↗
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    by {listing.postedByUser.name} · {listing.postedByUser.email} · {reports.length}{" "}
                    open report{reports.length === 1 ? "" : "s"}
                  </p>
                </div>
                <ListingModerationButton listingId={listing.id} action="remove" />
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {reports.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-start justify-between gap-3 border-t border-gray-100 pt-3 dark:border-slate-800"
                  >
                    <div className="flex gap-3">
                      <Avatar name={r.reporter.name} src={`/api/admin/users/${r.reporter.id}/photo`} size={32} />
                      <div>
                        <p className="text-sm font-medium">
                          {isFreelanceReportReason(r.reason) ? FREELANCE_REPORT_REASONS[r.reason] : r.reason}
                        </p>
                        {r.details && (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.details}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                          Reported by {r.reporter.name} ({r.reporter.email}) on {formatDate(r.createdAt)}
                        </p>
                      </div>
                    </div>
                    <DismissReportButton reportId={r.id} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {removedListings.length > 0 && (
        <>
          <h2 className="mb-3 mt-12 text-lg font-medium">Removed listings</h2>
          <div className="flex flex-col gap-2">
            {removedListings.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 dark:border-slate-700 p-3"
              >
                <p className="text-sm">
                  <span className="font-medium">{l.title}</span>{" "}
                  <span className="text-gray-500 dark:text-slate-400">
                    by {l.postedByUser.name} · removed {l.removedByAdminAt ? formatDate(l.removedByAdminAt) : ""}
                  </span>
                </p>
                <ListingModerationButton listingId={l.id} action="restore" />
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
