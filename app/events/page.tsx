import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_TABS,
  EVENT_FORMAT_LABELS,
  EVENT_AUDIENCE_LABELS,
  formatDateRange,
} from "@/lib/eventLabels";
import { Badge } from "@/components/Badge";
import { Thumbnail } from "@/components/Thumbnail";
import { SaveButton } from "@/components/SaveButton";

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
  isSaved,
}: {
  event: {
    id: string;
    slug: string;
    type: string;
    title: string;
    startDate: Date;
    endDate: Date;
    format: string;
    city: string | null;
    audience: string;
    seatsTotal: number;
    seatsFilled: number;
    fee: unknown;
    thumbnailUrl: string | null;
  };
  isSaved: boolean | null;
}) {
  const seatsLeft = event.seatsTotal - event.seatsFilled;
  return (
    <div className="relative">
      {isSaved !== null && (
        <div className="absolute right-2 top-2 z-10">
          <SaveButton endpoint={`/api/events/${event.slug}/wishlist`} isSaved={isSaved} variant="overlay" />
        </div>
      )}
      <Link
        href={`/events/${event.slug}`}
        className="block overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
      >
        <Thumbnail url={event.thumbnailUrl} alt={event.title} icon="📅" />
        <div className="p-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="brand">{EVENT_TYPE_LABELS[event.type]}</Badge>
            {event.audience !== "EVERYONE" && (
              <Badge variant="neutral">{EVENT_AUDIENCE_LABELS[event.audience]}</Badge>
            )}
          </div>
          <h3 className="mt-2 font-medium text-slate-900 dark:text-white">{event.title}</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            {formatDateRange(event.startDate, event.endDate)}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            {EVENT_FORMAT_LABELS[event.format]}
            {event.city && ` · ${event.city}`} ·{" "}
            {seatsLeft > 0 ? `${seatsLeft} seats left` : "Full"}
          </p>
          <p className="mt-2 font-semibold text-slate-900 dark:text-white">
            {Number(event.fee) === 0 ? "Free" : `₹${event.fee}`}
          </p>
        </div>
      </Link>
    </div>
  );
}

const PAYMENT_OPTIONS = [
  { value: "", label: "Any price" },
  { value: "FREE", label: "Free" },
  { value: "PAID", label: "Paid" },
];

/** Builds a query string from the current filters plus one overridden field, for links that change a single filter without dropping the others. */
function buildQuery(
  base: { type?: string; q?: string; format?: string; payment?: string; city?: string; audience?: string },
  overrides: { type?: string }
): string {
  const merged = { ...base, ...overrides };
  const params = new URLSearchParams();
  if (merged.type) params.set("type", merged.type);
  if (merged.q) params.set("q", merged.q);
  if (merged.format) params.set("format", merged.format);
  if (merged.payment) params.set("payment", merged.payment);
  if (merged.city) params.set("city", merged.city);
  if (merged.audience) params.set("audience", merged.audience);
  const qs = params.toString();
  return qs ? `/events?${qs}` : "/events";
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: {
    type?: string;
    q?: string;
    format?: string;
    payment?: string;
    city?: string;
    audience?: string;
  };
}) {
  const session = await getServerSession(authOptions);
  const activeType = searchParams.type;
  const q = searchParams.q?.trim();
  const activeFormat = searchParams.format;
  const activePayment = searchParams.payment;
  const activeCity = searchParams.city;
  const activeAudience = searchParams.audience;
  const now = new Date();

  // This page is scoped to "Upcoming & ongoing" (its own title) — excluding
  // already-ended events here, rather than just not rendering them, keeps
  // `events` and the ongoing/upcoming split in sync. Without this, a search
  // that only matched a past event left `events` non-empty while both
  // buckets were empty, silently rendering a blank results area instead of
  // the "no events" message.
  const [events, cityRows] = await Promise.all([
    prisma.event.findMany({
      where: {
        isPublished: true,
        endDate: { gte: now },
        ...(activeType ? { type: activeType as never } : {}),
        ...(activeFormat ? { format: activeFormat as never } : {}),
        ...(activePayment === "FREE" ? { fee: 0 } : activePayment === "PAID" ? { fee: { gt: 0 } } : {}),
        ...(activeCity ? { city: activeCity } : {}),
        ...(activeAudience ? { audience: activeAudience as never } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { shortDescription: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { startDate: "asc" },
    }),
    // Independent of the filters above, so the Location dropdown always
    // lists every city with a live event rather than shrinking to just
    // whatever the current filter selection happens to match.
    prisma.event.findMany({
      where: { isPublished: true, endDate: { gte: now }, city: { not: null } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
  ]);
  const cities = cityRows.map((r) => r.city as string);

  const savedEventIds = session
    ? new Set(
        (
          await prisma.eventWishlist.findMany({
            where: { userId: session.user.id, eventId: { in: events.map((e) => e.id) } },
            select: { eventId: true },
          })
        ).map((w) => w.eventId)
      )
    : null;

  const ongoing = events.filter((e) => e.startDate <= now && e.endDate >= now);
  const upcoming = events.filter((e) => e.startDate > now);

  const activeLabel = activeType
    ? EVENT_TYPE_TABS.find((t) => t.type === activeType)?.label
    : null;
  const hasActiveFilters = Boolean(activeFormat || activePayment || activeCity || activeAudience);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">
        {activeLabel ?? "📅 Upcoming & ongoing events"}
      </h1>

      <form className="mb-4 flex flex-wrap gap-2" action="/events">
        {activeType && <input type="hidden" name="type" value={activeType} />}
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by title or description..."
          className="min-w-[200px] flex-1 rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
        />
        <select
          name="format"
          defaultValue={activeFormat ?? ""}
          className="rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
        >
          <option value="">Any format</option>
          {Object.entries(EVENT_FORMAT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="payment"
          defaultValue={activePayment ?? ""}
          className="rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
        >
          {PAYMENT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="city"
          defaultValue={activeCity ?? ""}
          className="rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
        >
          <option value="">Any location</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <select
          name="audience"
          defaultValue={activeAudience ?? ""}
          className="rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
        >
          <option value="">Any audience</option>
          {Object.entries(EVENT_AUDIENCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
        >
          Search
        </button>
        {(q || hasActiveFilters) && (
          <Link
            href={activeType ? `/events?type=${activeType}` : "/events"}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Clear filters
          </Link>
        )}
      </form>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href={buildQuery(searchParams, { type: undefined })}
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
            href={buildQuery(searchParams, { type })}
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
          👀 No {activeLabel ? activeLabel.toLowerCase() : "events"}
          {q || hasActiveFilters ? " match your search" : " published yet — check back soon!"}
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
                  <EventCard key={event.id} event={event} isSaved={savedEventIds ? savedEventIds.has(event.id) : null} />
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
                  <EventCard key={event.id} event={event} isSaved={savedEventIds ? savedEventIds.has(event.id) : null} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
