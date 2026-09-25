import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Award, CalendarDays, CheckCircle2, ClipboardList, Clock, MapPin, Receipt, Video } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPE_LABELS, formatDateRange } from "@/lib/eventLabels";
import { issueEventCertificateIfEligible } from "@/lib/certificate";
import { buildGoogleFormUrl } from "@/lib/enrollment";
import { Badge } from "@/components/Badge";
import { CancelRegistrationButton } from "@/components/events/CancelRegistrationButton";
import { RequestRefundButton } from "@/components/RequestRefundButton";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_PRIMARY_BUTTON_CLASS,
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DashboardEmptyState,
  DashboardShell,
  DashboardTabs,
} from "@/components/dashboard/DashboardShell";

const CERT_STATUS_LABEL: Record<string, string> = {
  ELIGIBLE: "Certificate processing",
  PROCESSING: "Certificate processing",
  FAILED: "Certificate delayed — we're on it",
  REVOKED: "Certificate revoked",
};
const CERT_STATUS_VARIANT: Record<string, "success" | "warning" | "brand" | "neutral"> = {
  ELIGIBLE: "warning",
  PROCESSING: "brand",
  FAILED: "warning",
  REVOKED: "neutral",
};

const IST = "Asia/Kolkata";

export default async function MyEventsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: { userId: session.user.id, status: "CONFIRMED" },
    include: { event: true },
    orderBy: { event: { startDate: "asc" } },
  });

  // Concluded events auto-issue a certificate the next time the student visits this page.
  // allSettled so one certificate-issuance failure can't take down the whole page.
  const issuanceResults = await Promise.allSettled(
    registrations
      .filter((r) => r.event.endDate < new Date())
      .map((r) => issueEventCertificateIfEligible(session.user.id, r.eventId)),
  );
  for (const result of issuanceResults) {
    if (result.status === "rejected") {
      console.error("Certificate issuance failed:", result.reason);
    }
  }

  const certificates = await prisma.certificate.findMany({
    where: { userId: session.user.id, eventId: { in: registrations.map((r) => r.eventId) } },
  });
  const certByEventId = new Map(certificates.map((c) => [c.eventId, c]));

  const pendingRequests = await prisma.refundRequest.findMany({
    where: {
      status: "PENDING",
      eventRegistrationId: { in: registrations.map((r) => r.id) },
    },
    select: { eventRegistrationId: true },
  });
  const pendingRegistrationIds = new Set(pendingRequests.map((r) => r.eventRegistrationId));

  const now = new Date();
  const upcoming = registrations.filter((r) => r.event.endDate >= now);
  // Most recent first for past events.
  const past = registrations.filter((r) => r.event.endDate < now).reverse();
  const tab = searchParams.tab === "past" ? "past" : "upcoming";
  const visible = tab === "past" ? past : upcoming;

  return (
    <DashboardShell
      title="My events"
      description={
        registrations.length > 0
          ? `${upcoming.length} upcoming · ${past.length} past`
          : "Events you register for show up here, with your enrolment details and certificates."
      }
      actions={
        registrations.length > 0 && (
          <Link href="/events" className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
            <CalendarDays aria-hidden className="h-4 w-4" />
            Browse events
          </Link>
        )
      }
    >
      {registrations.length === 0 ? (
        <DashboardEmptyState
          icon={CalendarDays}
          title="You haven't registered for an event yet"
          text="Conferences, webinars, workshops and faculty development programmes — most come with a certificate."
          href="/events"
          cta="Browse events"
        />
      ) : (
        <>
          <DashboardTabs
            active={tab}
            tabs={[
              { key: "upcoming", label: "Upcoming", count: upcoming.length, href: "/dashboard/registrations" },
              { key: "past", label: "Past", count: past.length, href: "/dashboard/registrations?tab=past" },
            ]}
          />

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
              {tab === "past" ? (
                "No past events yet."
              ) : (
                <>
                  Nothing coming up.{" "}
                  <Link href="/events" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                    Find your next event
                  </Link>
                </>
              )}
            </p>
          ) : (
            <ul className="space-y-4">
              {visible.map((r) => {
                const { event } = r;
                const googleFormUrl =
                  !r.formSubmitted && r.enrollmentNumber
                    ? buildGoogleFormUrl(event, {
                        name: r.certificateName ?? session.user.name ?? "",
                        email: session.user.email ?? "",
                        enrollmentNumber: r.enrollmentNumber,
                      })
                    : null;
                const cert = certByEventId.get(event.id);
                const certReady = cert && (cert.status === "AVAILABLE" || cert.status === "GENERATED");
                const isLive = event.startDate <= now && event.endDate >= now;
                const isPast = event.endDate < now;
                const canCancel = Number(event.fee) === 0 && event.startDate > now;
                const place =
                  event.format === "ONLINE"
                    ? "Online"
                    : event.format === "HYBRID"
                      ? "Hybrid"
                      : (event.city ?? "In person");

                return (
                  <li key={event.id} className={`${DASHBOARD_CARD_CLASS} p-5`}>
                    <div className="flex gap-4">
                      <div
                        className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl ${
                          isPast
                            ? "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                            : "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                        }`}
                      >
                        <span className="text-xs font-semibold uppercase leading-none">
                          {event.startDate.toLocaleDateString("en-IN", { month: "short", timeZone: IST })}
                        </span>
                        <span className="text-2xl font-bold leading-tight">
                          {event.startDate.toLocaleDateString("en-IN", { day: "numeric", timeZone: IST })}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="brand">{EVENT_TYPE_LABELS[event.type]}</Badge>
                          {isLive && <Badge variant="success">Happening now</Badge>}
                          {r.formSubmitted && (
                            <Badge variant="success">
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 aria-hidden className="h-3 w-3" />
                                Form submitted
                              </span>
                            </Badge>
                          )}
                        </div>
                        <Link
                          href={`/events/${event.slug}`}
                          className="mt-1.5 block font-semibold leading-snug text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                        >
                          {event.title}
                        </Link>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock aria-hidden className="h-4 w-4 shrink-0" />
                            {formatDateRange(event.startDate, event.endDate)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            {event.format === "ONLINE" ? (
                              <Video aria-hidden className="h-4 w-4 shrink-0" />
                            ) : (
                              <MapPin aria-hidden className="h-4 w-4 shrink-0" />
                            )}
                            {place}
                          </span>
                        </div>
                        {r.enrollmentNumber && (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Enrolment no.{" "}
                            <span className="font-mono text-slate-700 dark:text-slate-300">{r.enrollmentNumber}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {googleFormUrl && (
                      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-amber-800 dark:bg-amber-900/20">
                        <p className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                          <ClipboardList aria-hidden className="h-4 w-4 shrink-0" />
                          One step left: complete the organiser&rsquo;s registration form.
                        </p>
                        <a
                          href={googleFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${DASHBOARD_PRIMARY_BUTTON_CLASS} shrink-0 py-1.5`}
                        >
                          Complete form
                        </a>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                      {certReady ? (
                        <Link href="/dashboard/certificates" className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
                          <Award aria-hidden className="h-4 w-4 text-amber-500" />
                          Certificate
                        </Link>
                      ) : (
                        cert && (
                          <Badge variant={CERT_STATUS_VARIANT[cert.status] ?? "neutral"}>
                            {CERT_STATUS_LABEL[cert.status] ?? cert.status}
                          </Badge>
                        )
                      )}
                      <a
                        href={`/api/receipts/event/${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={DASHBOARD_SECONDARY_BUTTON_CLASS}
                      >
                        <Receipt aria-hidden className="h-4 w-4" />
                        Receipt
                      </a>
                      {Number(r.amount) > 0 && (
                        <RequestRefundButton kind="event" itemId={r.id} isPending={pendingRegistrationIds.has(r.id)} />
                      )}
                      {canCancel && (
                        <span className="ml-auto">
                          <CancelRegistrationButton slug={event.slug} />
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </DashboardShell>
  );
}
