import { buildGoogleCalendarUrl, buildOutlookCalendarUrl, type CalendarEvent } from "@/lib/calendarLinks";
import { EVENT_FORMAT_LABELS } from "@/lib/eventLabels";

type EventForCalendar = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  startDate: Date;
  endDate: Date;
  format: string;
  city: string | null;
  venueOrLink: string;
};

/**
 * An event as a calendar entry. The exact venue / meeting link is only for
 * people who've registered (the event page hides it otherwise), so it's
 * included only when `includeVenue` is set — i.e. in the registration
 * confirmation email. Public links get the format and city instead.
 */
export function eventToCalendar(
  event: EventForCalendar,
  siteUrl: string,
  { includeVenue = false }: { includeVenue?: boolean } = {}
): CalendarEvent {
  const publicLocation =
    event.format === "ONLINE"
      ? "Online"
      : `${EVENT_FORMAT_LABELS[event.format] ?? "In person"}${event.city ? ` · ${event.city}` : ""}`;
  return {
    uid: `event-${event.id}`,
    title: event.title,
    start: event.startDate,
    end: event.endDate,
    details: includeVenue
      ? `${event.shortDescription ?? ""}\n\nVenue / link: ${event.venueOrLink}`.trim()
      : `${event.shortDescription ?? ""}\n\nVenue details are on the event page once you've registered.`.trim(),
    location: includeVenue ? event.venueOrLink : publicLocation,
    url: `${siteUrl}/events/${event.slug}`,
  };
}

/**
 * Calendar links for the registration confirmation email. The recipient has
 * registered, so the Google/Outlook entries carry the real venue / link; the
 * .ics download is the public one (it can't know who's asking).
 *
 * Never throws: it's evaluated inline in payment-settlement code that has
 * already committed the registration, so a problem building the links must
 * just leave them out of the email rather than fail the settlement.
 */
export function eventCalendarEmailLinks(
  event: EventForCalendar,
  siteUrl: string
): { googleUrl: string; outlookUrl: string; icsUrl: string } | undefined {
  try {
    const calendar = eventToCalendar(event, siteUrl, { includeVenue: true });
    return {
      googleUrl: buildGoogleCalendarUrl(calendar),
      outlookUrl: buildOutlookCalendarUrl(calendar),
      icsUrl: `${siteUrl}/api/events/${event.slug}/calendar`,
    };
  } catch (err) {
    console.error("Couldn't build calendar links for event email:", err);
    return undefined;
  }
}
