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

export function formatDateRange(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();
  const dateOpts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };

  if (sameDay) {
    return `${start.toLocaleDateString(undefined, dateOpts)}, ${start.toLocaleTimeString(undefined, timeOpts)} – ${end.toLocaleTimeString(undefined, timeOpts)}`;
  }
  return `${start.toLocaleDateString(undefined, dateOpts)} – ${end.toLocaleDateString(undefined, dateOpts)}`;
}

export function formatDateTime(date: Date): string {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
