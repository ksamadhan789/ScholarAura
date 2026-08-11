import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPE_LABELS, EVENT_TYPE_TABS, formatDateRange } from "@/lib/eventLabels";
import { Badge } from "@/components/Badge";
import { Thumbnail } from "@/components/Thumbnail";

export function generateMetadata({
  searchParams,
}: {
  searchParams: { type?: string };
}): Metadata {
  const activeLabel = searchParams.type
    ? EVENT_TYPE_TABS.find((t) => t.type === searchParams.type)?.label
    : null;

  return {
    title: activeLabel ?? "Upcoming & Ongoing Events",
    description:
      "Conferences, faculty development programs, and hands-on trainings hosted on ScholarAura.",
  };
}

function EventCard({
  event,
}: {
  event: {
    id: string;
    slug: string;
    type: string;
    title: string;
    startDate: Date;
    endDate: Date;
    isOnline: boolean;
    seatsTotal: number;
    seatsFilled: number;
    fee: unknown;
    thumbnailUrl: string | null;
  };
}) {
  const seatsLeft = event.seatsTotal - event.seatsFilled;
  return (
    <Link
      href={`/events/${event.slug}`}
      className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
    >
      <Thumbnail url={event.thumbnailUrl} alt={event.title} icon="📅" />
      <div className="p-4">
        <Badge variant="brand">{EVENT_TYPE_LABELS[event.type]}</Badge>
        <h3 className="mt-2 font-medium text-slate-900 dark:text-white">{event.title}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          {formatDateRange(event.startDate, event.endDate)}
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          {event.isOnline ? "Online" : "In person"} ·{" "}
          {seatsLeft > 0 ? `${seatsLeft} seats left` : "Full"}
        </p>
        <p className="mt-2 font-semibold text-slate-900 dark:text-white">
          {Number(event.fee) === 0 ? "Free" : `₹${event.fee}`}
        </p>
      </div>
    </Link>
  );
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const activeType = searchParams.type;

  const events = await prisma.event.findMany({
    where: {
      isPublished: true,
      ...(activeType ? { type: activeType as never } : {}),
    },
    orderBy: { startDate: "asc" },
  });

  const now = new Date();
  const ongoing = events.filter((e) => e.startDate <= now && e.endDate >= now);
  const upcoming = events.filter((e) => e.startDate > now);

  const activeLabel = activeType
    ? EVENT_TYPE_TABS.find((t) => t.type === activeType)?.label
    : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">
        {activeLabel ?? "📅 Upcoming & ongoing events"}
      </h1>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/events"
          className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
            !activeType
              ? "bg-brand-600 text-white"
              : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          ✨ All
        </Link>
        {EVENT_TYPE_TABS.map(({ type, label }) => (
          <Link
            key={type}
            href={`/events?type=${type}`}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              activeType === type
                ? "bg-brand-600 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          👀 No {activeLabel ? activeLabel.toLowerCase() : "events"} published yet — check back
          soon!
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {ongoing.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                Ongoing
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {ongoing.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                Upcoming
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
