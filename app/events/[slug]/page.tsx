import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPE_LABELS, formatDateRange, formatDateTime } from "@/lib/eventLabels";
import { RegisterButton } from "./RegisterButton";
import { PeopleList } from "@/components/PeopleList";
import { WaitlistButton } from "@/components/events/WaitlistButton";
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

  const [registration, currentUser, rates, waitlistEntry] = session
    ? await Promise.all([
        prisma.eventRegistration.findUnique({
          where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
        }),
        prisma.user.findUnique({ where: { id: session.user.id } }),
        prisma.exchangeRate.findMany({ orderBy: { currencyCode: "asc" } }),
        prisma.eventWaitlist.findUnique({
          where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
        }),
      ])
    : [null, null, await prisma.exchangeRate.findMany({ orderBy: { currencyCode: "asc" } }), null];

  const serializedRates = rates.map((r) => ({
    currencyCode: r.currencyCode,
    symbol: r.symbol,
    rateFromInr: r.rateFromInr.toString(),
  }));

  const isAdmin = session?.user.role === "ADMIN";
  const isRegistered = registration?.status === "CONFIRMED";
  const seatsLeft = event.seatsTotal - event.seatsFilled;
  const canSeeVenue = isRegistered || isAdmin;

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      {!event.isPublished && (
        <p className="mb-4 inline-block rounded bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-sm text-amber-800 dark:text-amber-300">
          Draft — not visible to the public yet
        </p>
      )}
      <p className="text-sm text-gray-500 dark:text-slate-400">{EVENT_TYPE_LABELS[event.type]}</p>
      <h1 className="mt-1 text-2xl font-semibold">{event.title}</h1>
      {event.shortDescription && (
        <p className="mt-1 text-base text-gray-600 dark:text-slate-400">{event.shortDescription}</p>
      )}
      <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
        {formatDateRange(event.startDate, event.endDate)}
      </p>
      <p className="mt-4 text-gray-700">{event.description}</p>

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

      {(event.registrationStartDate || event.registrationDeadline || event.resultDate) && (
        <div className="mt-4 rounded border border-gray-200 dark:border-slate-700 p-4 text-sm">
          <p className="font-medium">Important dates</p>
          <div className="mt-2 flex flex-col gap-1 text-gray-600 dark:text-slate-400">
            {event.registrationStartDate && (
              <p>Registration opens: {formatDateTime(event.registrationStartDate)}</p>
            )}
            {event.registrationDeadline && (
              <p>Registration deadline: {formatDateTime(event.registrationDeadline)}</p>
            )}
            {event.resultDate && <p>Result declaration: {formatDateTime(event.resultDate)}</p>}
          </div>
        </div>
      )}

      {event.eligibility && (
        <p className="mt-4 text-sm text-gray-600 dark:text-slate-400">
          <span className="font-medium text-gray-900 dark:text-white">Who can participate: </span>
          {event.eligibility}
        </p>
      )}

      {(event.prizeFirst || event.prizeSecond || event.prizeThird || event.prizeDescription) && (
        <div className="mt-4 rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-900 dark:text-amber-200">
          <p className="font-medium">🏆 Prizes</p>
          <div className="mt-1 flex flex-col gap-1">
            {event.prizeFirst && <p>🥇 1st Prize: {event.prizeFirst}</p>}
            {event.prizeSecond && <p>🥈 2nd Prize: {event.prizeSecond}</p>}
            {event.prizeThird && <p>🥉 3rd Prize: {event.prizeThird}</p>}
            {event.prizeDescription && <p>{event.prizeDescription}</p>}
          </div>
        </div>
      )}

      <PeopleList people={(event.people as unknown as EventPerson[] | null) ?? []} />

      <div className="mt-4 flex flex-col gap-1 text-sm text-gray-600 dark:text-slate-400">
        <p>{event.isOnline ? "Online" : "In person"}</p>
        <p>
          {canSeeVenue
            ? event.venueOrLink
            : event.isOnline
              ? "The Zoom link will be shared here once you register."
              : "The venue address will be shared here once you register."}
        </p>
        <p>{seatsLeft > 0 ? `${seatsLeft} of ${event.seatsTotal} seats left` : "Fully booked"}</p>
      </div>

      <p className="mt-4 text-lg font-semibold">
        {Number(event.fee) === 0 ? "Free" : `₹${event.fee}`}
      </p>

      <div className="mt-6">
        {!session ? (
          <a href="/login" className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-5 py-2.5 text-white">
            Log in to register
          </a>
        ) : isRegistered ? (
          <p className="rounded bg-green-100 dark:bg-green-900/40 px-4 py-2.5 text-sm text-green-800 dark:text-green-300">
            🎉 You&apos;re registered for this event!
          </p>
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
    </main>
  );
}
