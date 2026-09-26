import { notFound } from "next/navigation";
import { ShareButtons } from "@/components/ShareButtons";
import { AddToCalendar } from "@/components/events/AddToCalendar";
import { eventToCalendar } from "@/lib/eventCalendar";
import { SITE_URL } from "@/lib/siteUrl";
import { CalendarDays, Clock, FileText, GraduationCap, MapPin, Monitor, Users } from "lucide-react";
import { ActionCard, ActionStatus, ACTION_PRIMARY_CLASS, DetailColumns } from "@/components/detail/DetailLayout";
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
import { FormNextStep } from "@/components/detail/FormNextStep";
import { buildGoogleFormUrl } from "@/lib/enrollment";
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
import { CheckoutAssurance } from "@/components/detail/CheckoutAssurance";

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
  const pendingFormUrl =
    session && isRegistered && !registration.formSubmitted && registration.enrollmentNumber
      ? buildGoogleFormUrl(event, {
          name: registration.certificateName ?? session.user.name ?? "",
          email: session.user.email ?? "",
          enrollmentNumber: registration.enrollmentNumber,
        })
      : null;
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
            {urgency && <Badge variant={urgency.variant}>{urgency.label} to register</Badge>}
            <Badge variant="brand">{feeLabel === "Free" ? "Free entry" : `Entry ${feeLabel}`}</Badge>
          </>
        }
        title={event.title}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden className="h-4 w-4" />
              {formatDateRange(event.startDate, event.endDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {event.format === "ONLINE" ? (
                <Monitor aria-hidden className="h-4 w-4" />
              ) : (
                <MapPin aria-hidden className="h-4 w-4" />
              )}
              {EVENT_FORMAT_LABELS[event.format]}
              {event.city && ` · ${event.city}`}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users aria-hidden className="h-4 w-4" />
              {seatsLeft > 0 ? `${seatsLeft} of ${event.seatsTotal} seats left` : "Fully booked"}
            </span>
          </>
        }
        actions={
          <>
            <a
              href="#register"
              // Desktop only — on phones the register card sits right below the hero.
              className="hidden rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50 lg:inline-block"
            >
              {isRegistered ? "Your registration ↓" : "Register now ↓"}
            </a>
            {event.brochureUrl && (
              <a
                href={event.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <FileText aria-hidden className="h-4 w-4" />
                Download brochure
              </a>
            )}
          </>
        }
      />

      <DetailColumns
        aside={
          <ActionCard
            label="Registration fee"
            price={feeLabel}
            priceNote={
              event.registrationDeadline && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock aria-hidden className="h-4 w-4" />
                  Register by {formatDateTime(event.registrationDeadline)}
                </span>
              )
            }
            footer={
              <>
                <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Users aria-hidden className="h-4 w-4" />
                  {seatsLeft > 0 ? `${seatsLeft} of ${event.seatsTotal} seats left` : "Fully booked"}
                </p>
                {event.brochureUrl && (
                  <a
                    href={event.brochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    <FileText aria-hidden className="h-4 w-4" />
                    Download brochure
                  </a>
                )}
                {session && !isRegistered && (
                  <SaveButton endpoint={`/api/events/${event.slug}/wishlist`} isSaved={!!wishlistEntry} />
                )}
                {event.isPublished && event.endDate > new Date() && (
                  <AddToCalendar
                    calendar={eventToCalendar(event, SITE_URL, { includeVenue: canSeeVenue })}
                    icsUrl={`/api/events/${event.slug}/calendar`}
                  />
                )}
                {event.isPublished && (
                  <ShareButtons url={`${SITE_URL}/events/${event.slug}`} title={event.title} />
                )}
              </>
            }
          >
            {!session ? (
              <a
                href={`/login?callbackUrl=${encodeURIComponent(`/events/${event.slug}`)}`}
                className={ACTION_PRIMARY_CLASS}
              >
                Log in to register
              </a>
            ) : isRegistered ? (
              <>
                <ActionStatus tone="success">You&apos;re registered for this event!</ActionStatus>
                {pendingFormUrl && <FormNextStep url={pendingFormUrl} />}
                {Number(event.fee) === 0 && event.startDate > new Date() && (
                  <CancelRegistrationButton slug={event.slug} />
                )}
              </>
            ) : seatsLeft <= 0 ? (
              <WaitlistButton slug={event.slug} isWaitlisted={!!waitlistEntry} />
            ) : (
              <>
                {Number(event.fee) > 0 && currentUser && Number(currentUser.creditBalance) > 0 && (
                  <p className="text-sm text-green-700 dark:text-green-400">
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
            {session && Number(event.fee) > 0 && !isRegistered && <CheckoutAssurance refundNote="Full refund if you cancel at least 7 days before the event." />}
          </ActionCard>
        }
      >
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
            <InfoCard icon={GraduationCap} title="Who can participate?" tone="success">
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
      </DetailColumns>
    </main>
  );
}
