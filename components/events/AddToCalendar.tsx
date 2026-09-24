import { CalendarPlus } from "lucide-react";
import { buildGoogleCalendarUrl, buildOutlookCalendarUrl, type CalendarEvent } from "@/lib/calendarLinks";

// "Add to calendar" links for an event page — Google and Outlook open their
// own pre-filled "new event" pages; "Apple / other" downloads an .ics file.
export function AddToCalendar({ calendar, icsUrl }: { calendar: CalendarEvent; icsUrl: string }) {
  const chip =
    "inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600";
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <CalendarPlus aria-hidden className="h-3.5 w-3.5" />
        Add to calendar
      </p>
      <div className="flex flex-wrap gap-1.5">
        <a href={buildGoogleCalendarUrl(calendar)} target="_blank" rel="noopener noreferrer" className={chip}>
          Google
        </a>
        <a href={buildOutlookCalendarUrl(calendar)} target="_blank" rel="noopener noreferrer" className={chip}>
          Outlook
        </a>
        <a href={icsUrl} className={chip}>
          Apple / other
        </a>
      </div>
    </div>
  );
}
