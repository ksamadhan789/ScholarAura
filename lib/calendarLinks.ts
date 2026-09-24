// "Add to calendar" helpers for events: Google Calendar and Outlook web
// links, and an iCalendar (.ics) file for Apple Calendar and everything else.
// Pure functions, no browser APIs — shared by the event page, the .ics route
// and the registration confirmation email.

export type CalendarEvent = {
  /** Stable id for the .ics UID, so re-importing updates rather than duplicates. */
  uid: string;
  title: string;
  start: Date;
  end: Date;
  /** Plain text; the event page URL is appended by callers. */
  details: string;
  /** Public pages pass only the city / "Online" — the real venue or meeting
   * link is shown only to registered people. */
  location: string;
  url: string;
};

/** 20260315T043000Z — the basic UTC format Google Calendar and iCalendar use. */
export function toCalendarUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildGoogleCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${toCalendarUtc(e.start)}/${toCalendarUtc(e.end)}`,
    details: `${e.details}\n\n${e.url}`,
    location: e.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildOutlookCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: e.title,
    startdt: e.start.toISOString(),
    enddt: e.end.toISOString(),
    body: `${e.details}\n\n${e.url}`,
    location: e.location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** Escapes TEXT values per RFC 5545 §3.3.11. */
function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Folds a content line to ≤75 octets per RFC 5545 §3.1 (continuations start with a space). */
function foldIcsLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    const limit = parts.length === 0 ? 75 : 74; // continuation lines lose one octet to the leading space
    if (currentBytes + size > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** A complete single-event .ics file (CRLF line endings, as the spec requires). */
export function buildIcs(e: CalendarEvent, now: Date = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ScholarAura//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}@scholaraura.com`,
    `DTSTAMP:${toCalendarUtc(now)}`,
    `DTSTART:${toCalendarUtc(e.start)}`,
    `DTEND:${toCalendarUtc(e.end)}`,
    `SUMMARY:${escapeIcsText(e.title)}`,
    `DESCRIPTION:${escapeIcsText(`${e.details}\n\n${e.url}`)}`,
    `LOCATION:${escapeIcsText(e.location)}`,
    `URL:${e.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}
