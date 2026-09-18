import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  EVENT_TYPE_LABELS,
  EVENT_FORMAT_LABELS,
  EVENT_AUDIENCE_LABELS,
  formatDateRange,
  formatDateTime,
  getDeadlineUrgency,
} from "@/lib/eventLabels";
import { RegisterButton } from "./RegisterButton";
import { PeopleList } from "@/components/PeopleList";
import { WaitlistButton } from "@/components/events/WaitlistButton";
import { CancelRegistrationButton } from "@/components/events/CancelRegistrationButton";
import { SaveButton } from "@/components/SaveButton";
import { Badge } from "@/components/Badge";
import { DetailHero } from "@/components/DetailHero";
import { InfoCard } from "@/components/InfoCard";
import type { EventPerson } from "@/lib/eventPeople";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const event = await prisma.event.findUnique({
    where: { slug: params.slug, isPublished: true },
    select: { title: true, description: true },
  });

  if (!event) return {};

  return {
    title: event.title,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
      type: "website",
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });

  if (!event || (!event.isPublished && session?.user.role !== "ADMIN")) {
    notFound();
  }

  const [registration, currentUser, rates, waitlistEntry, wishlistEntry] = session
    ? await Promise.all([
        prisma.eventRegistration.findUnique({
          where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
        }),
        prisma.user.findUnique({ where: { id: session.user.id } }),
        prisma.exchangeRate.findMany({ orderBy: { currencyCode: "asc" } }),
        prisma.eventWaitlist.findUnique({
          where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
        }),
        prisma.eventWishlist.findUnique({
          where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
        }),
      ])
    : [null, null, await prisma.exchangeRate.findMany({ orderBy: { currencyCode: "asc" } }), null, null];

  const serializedRates = rates.map((r) => ({
    currencyCode: r.currencyCode,
    symbol: r.symbol,
    rateFromInr: r.rateFromInr.toString(),
  }));

  const isAdmin = session?.user.role === "ADMIN";
  const isRegistered = registration?.status === "CONFIRMED";
  const seatsLeft = event.seatsTotal - event.seatsFilled;
  const canSeeVenue = isRegistered || isAdmin;

  const urgency = event.registrationDeadline ? getDeadlineUrgency(event.registrationDeadline) : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      {!event.isPublished && (
        <p className="mb-4 inline-block rounded bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-sm text-amber-800 dark:text-amber-300">
          Draft — not visible to the public yet
        </p>
      )}

      <DetailHero
        image={event.thumbnailUrl}
        eyebrow={EVENT_TYPE_LABELS[event.type]}
        badges={
          <>
            {event.audience !== "EVERYONE" && (
              <Badge variant="neutral">{EVENT_AUDIENCE_LABELS[event.audience]}</Badge>
            )}
            {urgency && <Badge variant={urgency.variant}>⏰ {urgency.label} to register</Badge>}
          </>
        }
        title={event.title}
        meta={
          <>
            <span>📅 {formatDateRange(event.startDate, event.endDate)}</span>
            <span>
              {EVENT_FORMAT_LABELS[event.format]}
              {event.city && ` · ${event.city}`}
            </span>
            <span>{seatsLeft > 0 ? `${seatsLeft} of ${event.seatsTotal} seats left` : "Fully booked"}</span>
          </>
        }
      />

      {event.shortDescription && (
        <p className="mt-4 text-base text-gray-600 dark:text-slate-400">{event.shortDescription}</p>
      )}
      <p className="mt-4 text-gray-700 dark:text-slate-300">{event.description}</p>

      {event.brochureUrl && (
        <a
          href={event.brochureUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-medium text-brand-600 underline hover:text-brand-700 dark:text-brand-400"
        >
          📄 Download brochure
        </a>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(event.registrationStartDate || event.registrationDeadline || event.resultDate) && (
          <InfoCard icon="🗓️" title="Important dates">
            {event.registrationStartDate && (
              <p>Registration opens: {formatDateTime(event.registrationStartDate)}</p>
            )}
            {event.registrationDeadline && (
              <p>Registration deadline: {formatDateTime(event.registrationDeadline)}</p>
            )}
            {event.resultDate && <p>Result declaration: {formatDateTime(event.resultDate)}</p>}
          </InfoCard>
        )}

        {(event.prizeFirst || event.prizeSecond || event.prizeThird || event.prizeDescription) && (
          <InfoCard icon="🏆" title="Prizes" tone="amber">
            {event.prizeFirst && <p>🥇 1st Prize: {event.prizeFirst}</p>}
            {event.prizeSecond && <p>🥈 2nd Prize: {event.prizeSecond}</p>}
            {event.prizeThird && <p>🥉 3rd Prize: {event.prizeThird}</p>}
            {event.prizeDescription && <p>{event.prizeDescription}</p>}
          </InfoCard>
        )}
      </div>

      {event.eligibility && (
        <p className="mt-4 text-sm text-gray-600 dark:text-slate-400">
          <span className="font-medium text-gray-900 dark:text-white">Who can participate: </span>
          {event.eligibility}
        </p>
      )}

      <PeopleList people={(event.people as unknown as EventPerson[] | null) ?? []} />

      <p className="mt-4 text-sm text-gray-600 dark:text-slate-400">
        {canSeeVenue
          ? event.venueOrLink
          : event.format === "ONLINE"
            ? "The Zoom link will be shared here once you register."
            : "The venue address will be shared here once you register."}
      </p>

      <p className="mt-4 text-lg font-semibold">
        {Number(event.fee) === 0 ? "Free" : `₹${event.fee}`}
      </p>

      <div className="mt-6">
        {!session ? (
          <a href="/login" className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-5 py-2.5 text-white">
            Log in to register
          </a>
        ) : isRegistered ? (
          <div className="flex flex-col items-start gap-2">
            <p className="rounded bg-green-100 dark:bg-green-900/40 px-4 py-2.5 text-sm text-green-800 dark:text-green-300">
              🎉 You&apos;re registered for this event!
            </p>
            {Number(event.fee) === 0 && event.startDate > new Date() && (
              <CancelRegistrationButton slug={event.slug} />
            )}
          </div>
        ) : seatsLeft <= 0 ? (
          <WaitlistButton slug={event.slug} isWaitlisted={!!waitlistEntry} />
        ) : (
          <>
            {Number(event.fee) > 0 && currentUser && Number(currentUser.creditBalance) > 0 && (
              <p className="mb-2 text-sm text-green-700 dark:text-green-400">
                You have ₹{Number(currentUser.creditBalance).toFixed(2)} credit — applied
                automatically when paying in INR.
              </p>
            )}
            <RegisterButton
              slug={event.slug}
              isPaid={Number(event.fee) > 0}
              price={Number(event.fee)}
              rates={serializedRates}
              userName={session.user.name}
              userEmail={session.user.email}
            />
          </>
        )}
      </div>

      {session && !isRegistered && (
        <div className="mt-3">
          <SaveButton endpoint={`/api/events/${event.slug}/wishlist`} isSaved={!!wishlistEntry} />
        </div>
      )}
    </main>
  );
}
