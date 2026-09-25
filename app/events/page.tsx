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
import { CalendarDays, MapPin, Monitor, Users } from "lucide-react";
import { Badge } from "@/components/Badge";
import { SaveButton } from "@/components/SaveButton";
import { MediaCard, PriceTag } from "@/components/listing/MediaCard";
import {
  CardGrid,
  EmptyState,
  FILTER_FIELD_CLASS,
  FilterActions,
  FilterGroup,
  FilterOption,
  FilterOptionList,
  FilterPanel,
  ListingHeader,
  ListingShell,
  ResultsSection,
} from "@/components/listing/ListingLayout";
import { readLocationCookie } from "@/lib/location";

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
    <MediaCard
      href={`/events/${event.slug}`}
      thumbnailUrl={event.thumbnailUrl}
      placeholderIcon={<CalendarDays className="h-10 w-10" />}
      title={event.title}
      badges={
        <>
          <Badge variant="brand">{EVENT_TYPE_LABELS[event.type]}</Badge>
          {event.audience !== "EVERYONE" && (
            <Badge variant="neutral">{EVENT_AUDIENCE_LABELS[event.audience]}</Badge>
          )}
          {/* Real scarcity only: the last quarter of seats, and at most 10. */}
          {seatsLeft > 0 && seatsLeft <= 10 && seatsLeft <= event.seatsTotal / 4 && (
            <Badge variant="warning">Only {seatsLeft} left</Badge>
          )}
          {seatsLeft <= 0 && <Badge variant="neutral">Full</Badge>}
        </>
      }
      meta={[
        { icon: CalendarDays, text: formatDateRange(event.startDate, event.endDate) },
        {
          icon: event.format === "ONLINE" ? Monitor : MapPin,
          text: `${EVENT_FORMAT_LABELS[event.format]}${event.city ? ` · ${event.city}` : ""}`,
        },
        { icon: Users, text: seatsLeft > 0 ? `${seatsLeft} seats left` : "Full — join the waitlist" },
      ]}
      footer={<PriceTag amount={event.fee} />}
      overlay={
        isSaved !== null && (
          <SaveButton endpoint={`/api/events/${event.slug}/wishlist`} isSaved={isSaved} variant="overlay" />
        )
      }
    />
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
  // A city query param that's present but empty (the filter form submits
  // "Any location" as city=) means the visitor explicitly wants no filter
  // for this view — only fall back to their saved location when the key
  // is absent entirely (a fresh visit to /events).
  const activeCity = searchParams.city !== undefined ? searchParams.city || undefined : readLocationCookie();
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

  const clearHref = activeType ? `/events?type=${activeType}` : "/events";

  return (
    <main>
      <ListingHeader
        title={activeLabel ?? "Upcoming & ongoing events"}
        subtitle="Conferences, faculty development programs, hands-on trainings, webinars and alumni meets."
      />

      <ListingShell
        sidebar={
          <FilterPanel action="/events">
            {activeType && <input type="hidden" name="type" value={activeType} />}
            <FilterGroup label="Search">
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Title or description…"
                className={FILTER_FIELD_CLASS}
              />
            </FilterGroup>
            <FilterGroup label="Event type">
              <FilterOptionList>
                <FilterOption href={buildQuery(searchParams, { type: undefined })} active={!activeType}>
                  All events
                </FilterOption>
                {EVENT_TYPE_TABS.map(({ type, label }) => (
                  <FilterOption key={type} href={buildQuery(searchParams, { type })} active={activeType === type}>
                    {label}
                  </FilterOption>
                ))}
              </FilterOptionList>
            </FilterGroup>
            <FilterGroup label="Format">
              <select name="format" defaultValue={activeFormat ?? ""} className={FILTER_FIELD_CLASS}>
                <option value="">Any format</option>
                {Object.entries(EVENT_FORMAT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FilterGroup>
            <FilterGroup label="Price">
              <select name="payment" defaultValue={activePayment ?? ""} className={FILTER_FIELD_CLASS}>
                {PAYMENT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FilterGroup>
            <FilterGroup label="Location">
              <select name="city" defaultValue={activeCity ?? ""} className={FILTER_FIELD_CLASS}>
                <option value="">Any location</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </FilterGroup>
            <FilterGroup label="Audience">
              <select name="audience" defaultValue={activeAudience ?? ""} className={FILTER_FIELD_CLASS}>
                <option value="">Any audience</option>
                {Object.entries(EVENT_AUDIENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FilterGroup>
            <FilterActions clearHref={q || hasActiveFilters ? clearHref : undefined} />
          </FilterPanel>
        }
      >
        {events.length === 0 ? (
          <EmptyState
            title={`No ${activeLabel ? activeLabel.toLowerCase() : "events"}${q || hasActiveFilters ? " match your search" : " yet"}`}
            text={q || hasActiveFilters ? "Try removing a filter or searching for something else." : "New events are added regularly — check back soon."}
          />
        ) : (
          <div className="flex flex-col gap-10">
            {ongoing.length > 0 && (
              <ResultsSection title="Happening now" count={ongoing.length}>
                <CardGrid>
                  {ongoing.map((event) => (
                    <EventCard key={event.id} event={event} isSaved={savedEventIds ? savedEventIds.has(event.id) : null} />
                  ))}
                </CardGrid>
              </ResultsSection>
            )}

            {upcoming.length > 0 && (
              <ResultsSection title="Upcoming" count={upcoming.length}>
                <CardGrid>
                  {upcoming.map((event) => (
                    <EventCard key={event.id} event={event} isSaved={savedEventIds ? savedEventIds.has(event.id) : null} />
                  ))}
                </CardGrid>
              </ResultsSection>
            )}
          </div>
        )}
      </ListingShell>
    </main>
  );
}
