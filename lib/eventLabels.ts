export const EVENT_TYPE_LABELS: Record<string, string> = {
  INTERNATIONAL_CONFERENCE: "🌍 International Conference",
  NATIONAL_CONFERENCE: "🏛️ National Conference",
  FDP: "🎓 Faculty Development Program",
  HANDS_ON_TRAINING: "🧪 VR Hands-on Training",
  WEBINAR: "💻 Webinar",
};

// Plural labels + stable order, used for nav/tab lists.
export const EVENT_TYPE_TABS: { type: string; label: string }[] = [
  { type: "INTERNATIONAL_CONFERENCE", label: "🌍 International Conferences" },
  { type: "NATIONAL_CONFERENCE", label: "🏛️ National Conferences" },
  { type: "WEBINAR", label: "💻 Webinars" },
  { type: "FDP", label: "🎓 Faculty Development Programs" },
  { type: "HANDS_ON_TRAINING", label: "🧪 VR Hands-on Trainings" },
];

// This app is India-only, but these run in Server Components on a server
// whose local timezone is whatever the host defaults to (UTC on a typical
// Vercel deployment) — without pinning Asia/Kolkata explicitly, every date
// shown here would be off by 5:30 from what the confirmation emails
// (lib/email.ts, which does pin it) show for the exact same event.
const IST_TIME_ZONE = "Asia/Kolkata";
const IST_LOCALE = "en-IN";

export function formatDateRange(start: Date, end: Date): string {
  const dateOpts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: IST_TIME_ZONE,
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: IST_TIME_ZONE,
  };
  const dayKeyOpts: Intl.DateTimeFormatOptions = { ...dateOpts };

  const sameDay =
    start.toLocaleDateString(IST_LOCALE, dayKeyOpts) === end.toLocaleDateString(IST_LOCALE, dayKeyOpts);

  if (sameDay) {
    return `${start.toLocaleDateString(IST_LOCALE, dateOpts)}, ${start.toLocaleTimeString(IST_LOCALE, timeOpts)} – ${end.toLocaleTimeString(IST_LOCALE, timeOpts)}`;
  }
  return `${start.toLocaleDateString(IST_LOCALE, dateOpts)} – ${end.toLocaleDateString(IST_LOCALE, dateOpts)}`;
}

export function formatDateTime(date: Date): string {
  return date.toLocaleDateString(IST_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: IST_TIME_ZONE,
  });
}
