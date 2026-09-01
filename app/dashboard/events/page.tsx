import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPE_LABELS, formatDateRange } from "@/lib/eventLabels";
import { EventPublishToggle } from "./EventPublishToggle";
import { EventArchiveToggle } from "./EventArchiveToggle";
import { Badge } from "@/components/Badge";

export default async function ManageEventsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const showArchived = searchParams.tab === "archived";

  const [events, waitlistCounts, activeCount, archivedCount] = await Promise.all([
    prisma.event.findMany({ where: { isArchived: showArchived }, orderBy: { startDate: "asc" } }),
    prisma.eventWaitlist.groupBy({ by: ["eventId"], _count: { _all: true } }),
    prisma.event.count({ where: { isArchived: false } }),
    prisma.event.count({ where: { isArchived: true } }),
  ]);
  const waitlistCountByEventId = new Map(waitlistCounts.map((w) => [w.eventId, w._count._all]));

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage events</h1>
        <Link
          href="/dashboard/events/new"
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white"
        >
          + New event
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        <Link
          href="/dashboard/events"
          className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
            !showArchived
              ? "bg-brand-600 text-white"
              : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          Active ({activeCount})
        </Link>
        <Link
          href="/dashboard/events?tab=archived"
          className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
            showArchived
              ? "bg-brand-600 text-white"
              : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          Archived ({archivedCount})
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          {showArchived ? "No archived events." : "No events created yet."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-4"
            >
              <div>
                <Link href={`/events/${event.slug}`} className="font-medium hover:underline">
                  {event.title}
                </Link>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {EVENT_TYPE_LABELS[event.type]} ·{" "}
                  {formatDateRange(event.startDate, event.endDate)}
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                  <Badge variant={event.isPublished ? "success" : "warning"}>
                    {event.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <span>
                    {event.seatsFilled}/{event.seatsTotal} registered
                  </span>
                  {(waitlistCountByEventId.get(event.id) ?? 0) > 0 && (
                    <span>· {waitlistCountByEventId.get(event.id)} waitlisted</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/events/${event.slug}/edit`}
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  Edit
                </Link>
                <Link
                  href={`/dashboard/events/${event.slug}/students`}
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  Registrations
                </Link>
                <Link
                  href={`/dashboard/events/${event.slug}/certificates`}
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  Certificates
                </Link>
                <EventPublishToggle slug={event.slug} isPublished={event.isPublished} />
                <EventArchiveToggle slug={event.slug} isArchived={event.isArchived} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
