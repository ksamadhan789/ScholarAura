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
import { DateCards } from "@/components/DateCards";
import { PrizeCards } from "@/components/PrizeCards";
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
  const feeLabel = Number(event.fee) === 0 ? "Free" : `₹${event.fee}`;

  const urgency = event.registrationDeadline ? getDeadlineUrgency(event.registrationDeadline) : null;

  const dateMilestones = [
    event.registrationDeadline && {
      label: "Registration deadline",
      date: event.registrationDeadline,
      emphasize: true,
    },
    event.resultDate && { label: "Result declaration", date: event.resultDate },
  ].filter((m): m is { label: string; date: Date; emphasize?: boolean } => Boolean(m));

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 sm:py-16">
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
            <Badge variant="brand">{feeLabel === "Free" ? "Free entry" : `Entry ${feeLabel}`}</Badge>
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
        actions={
          <>
            <a
              href="#register"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
            >
              Register Now ↓
            </a>
            {event.brochureUrl && (
              <a
                href={event.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                📄 Download Brochure
              </a>
            )}
          </>
        }
      />

      {event.shortDescription && (
        <p className="mt-4 text-base text-gray-600 dark:text-slate-400">{event.shortDescription}</p>
      )}
      <p className="mt-4 text-gray-700 dark:text-slate-300">{event.description}</p>

      <DateCards milestones={dateMilestones} />
      {event.registrationStartDate && (
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
          Registration opens {formatDateTime(event.registrationStartDate)}
        </p>
      )}

      <PrizeCards
        first={event.prizeFirst}
        second={event.prizeSecond}
        third={event.prizeThird}
        description={event.prizeDescription}
      />

      {event.eligibility && (
        <div className="mt-4">
          <InfoCard icon="🎓" title="Who can participate?" tone="success">
            <p>{event.eligibility}</p>
          </InfoCard>
        </div>
      )}

      <PeopleList people={(event.people as unknown as EventPerson[] | null) ?? []} />

      <p className="mt-4 text-sm text-gray-600 dark:text-slate-400">
        {canSeeVenue
          ? event.venueOrLink
          : event.format === "ONLINE"
            ? "The Zoom link will be shared here once you register."
            : "The venue address will be shared here once you register."}
      </p>

      <div
        id="register"
        className="mt-8 scroll-mt-24 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/60"
      >
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ready to join?</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Registration fee: {feeLabel}</p>

        <div className="mt-4">
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

        {event.brochureUrl && (
          <a
            href={event.brochureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            📄 Download brochure
          </a>
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
