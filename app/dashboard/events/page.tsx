import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPE_LABELS, formatDateRange } from "@/lib/eventLabels";
import { EventPublishToggle } from "./EventPublishToggle";
import { EventArchiveToggle } from "./EventArchiveToggle";
import { Badge } from "@/components/Badge";
import { Award, CalendarDays, Pencil, Plus, Users } from "lucide-react";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_PRIMARY_BUTTON_CLASS,
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DashboardEmptyState,
  DashboardShell,
  DashboardTabs,
  DateTile,
} from "@/components/dashboard/DashboardShell";

export default async function ManageEventsPage({ searchParams }: { searchParams: { tab?: string } }) {
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

  const now = new Date();

  return (
    <DashboardShell
      title="Manage events"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description="Conferences, webinars, workshops and FDPs, soonest first."
      actions={
        <Link href="/dashboard/events/new" className={`${DASHBOARD_PRIMARY_BUTTON_CLASS} py-1.5`}>
          <Plus aria-hidden className="h-4 w-4" />
          New event
        </Link>
      }
    >
      <DashboardTabs
        active={showArchived ? "archived" : "active"}
        tabs={[
          { key: "active", label: "Active", count: activeCount, href: "/dashboard/events" },
          { key: "archived", label: "Archived", count: archivedCount, href: "/dashboard/events?tab=archived" },
        ]}
      />

      {events.length === 0 ? (
        <DashboardEmptyState
          icon={CalendarDays}
          title={showArchived ? "No archived events" : "No events created yet"}
          href={showArchived ? undefined : "/dashboard/events/new"}
          cta={showArchived ? undefined : "Create an event"}
        />
      ) : (
        <ul className="space-y-4">
          {events.map((event) => {
            const waitlisted = waitlistCountByEventId.get(event.id) ?? 0;
            const fillPercent =
              event.seatsTotal > 0 ? Math.min(100, Math.round((event.seatsFilled / event.seatsTotal) * 100)) : 0;
            const ended = event.endDate < now;
            return (
              <li key={event.id} className={`${DASHBOARD_CARD_CLASS} p-5`}>
                <div className="flex gap-4">
                  <DateTile date={event.startDate} muted={ended} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={event.isPublished ? "success" : "warning"}>
                        {event.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant="brand">{EVENT_TYPE_LABELS[event.type]}</Badge>
                      {ended && <Badge variant="neutral">Ended</Badge>}
                    </div>
                    <Link
                      href={`/events/${event.slug}`}
                      className="mt-1.5 block font-semibold leading-snug text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                    >
                      {event.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {formatDateRange(event.startDate, event.endDate)}
                    </p>
                    <div className="mt-3 flex max-w-sm items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div className="h-full rounded-full bg-brand-600" style={{ width: `${fillPercent}%` }} />
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {event.seatsFilled}/{event.seatsTotal} registered
                        {waitlisted > 0 && ` · ${waitlisted} waitlisted`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                  <Link href={`/dashboard/events/${event.slug}/edit`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
                    <Pencil aria-hidden className="h-4 w-4" />
                    Edit
                  </Link>
                  <Link href={`/dashboard/events/${event.slug}/students`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
                    <Users aria-hidden className="h-4 w-4" />
                    Registrations
                  </Link>
                  <Link
                    href={`/dashboard/events/${event.slug}/certificates`}
                    className={DASHBOARD_SECONDARY_BUTTON_CLASS}
                  >
                    <Award aria-hidden className="h-4 w-4" />
                    Certificates
                  </Link>
                  <span className="ml-auto flex flex-wrap gap-1">
                    <EventPublishToggle slug={event.slug} isPublished={event.isPublished} />
                    <EventArchiveToggle slug={event.slug} isArchived={event.isArchived} />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
}
