import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPE_LABELS, formatDateRange } from "@/lib/eventLabels";
import { Badge } from "@/components/Badge";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { isPublished: true },
    orderBy: { startDate: "asc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-semibold">Upcoming events</h1>

      {events.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">No events published yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => {
            const seatsLeft = event.seatsTotal - event.seatsFilled;
            return (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="rounded-lg border border-gray-200 dark:border-slate-700 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
              >
                <Badge variant="brand">{EVENT_TYPE_LABELS[event.type]}</Badge>
                <h2 className="mt-2 font-medium text-slate-900 dark:text-white">{event.title}</h2>
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
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
