import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPE_LABELS, formatDateRange } from "@/lib/eventLabels";
import { EventPublishToggle } from "./EventPublishToggle";
import { BrochureUrlEditor } from "./BrochureUrlEditor";
import { Badge } from "@/components/Badge";

export default async function ManageEventsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const events = await prisma.event.findMany({ orderBy: { startDate: "asc" } });

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

      {events.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">No events created yet.</p>
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
                </div>
                <BrochureUrlEditor slug={event.slug} brochureUrl={event.brochureUrl} />
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/events/${event.slug}/students`}
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  Registrations
                </Link>
                <EventPublishToggle slug={event.slug} isPublished={event.isPublished} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
