export const EVENT_TYPE_LABELS: Record<string, string> = {
  INTERNATIONAL_CONFERENCE: "International Conference",
  NATIONAL_CONFERENCE: "National Conference",
  FDP: "Faculty Development Program",
  HANDS_ON_TRAINING: "Hands-on Training",
};

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
