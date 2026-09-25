import Link from "next/link";
import { Award, BadgeCheck, CalendarDays } from "lucide-react";

export type HeroNextEvent = { title: string; href: string; dateLabel: string } | null;

/**
 * The homepage hero's visual: an illustration of the kind of certificate
 * learners earn — plainly labelled "Sample", with placeholder text, never a
 * real person's name — plus, when one exists, the next real upcoming event.
 */
export function HeroCertificate({ nextEvent }: { nextEvent: HeroNextEvent }) {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-label="Sample certificate">
      <div
        aria-hidden
        className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-200/60 via-sky-200/40 to-transparent blur-2xl dark:from-brand-900/40 dark:via-sky-900/20"
      />

      <div className="rotate-[-2deg] rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="rounded-xl border-2 border-double border-amber-300/80 p-5 dark:border-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Certificate</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              Sample
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">This certifies that</p>
          <p className="mt-1 font-serif text-2xl font-semibold italic text-slate-900 dark:text-white">Your name here</p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">has successfully completed</p>
          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">Your course or event</p>

          <div className="mt-6 flex items-end justify-between">
            <div>
              <div className="h-px w-24 bg-slate-300 dark:bg-slate-600" />
              <p className="mt-1 text-[11px] text-slate-400">Authorised signatory</p>
            </div>
            <Award aria-hidden className="h-10 w-10 text-amber-400" strokeWidth={1.5} />
          </div>
          <p className="mt-4 font-mono text-[11px] tracking-wide text-slate-400">CERT-2026-000000-XXXXXXXX</p>
        </div>
      </div>

      <div className="absolute -right-4 top-1/2 flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-lg dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300">
        <BadgeCheck aria-hidden className="h-4 w-4" />
        Anyone can verify it
      </div>

      {nextEvent && (
        <Link
          href={nextEvent.href}
          className="absolute -bottom-8 -left-4 flex max-w-[16rem] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-slate-800 dark:text-brand-400">
            <CalendarDays aria-hidden className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
              Up next · {nextEvent.dateLabel}
            </span>
            <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{nextEvent.title}</span>
          </span>
        </Link>
      )}
    </div>
  );
}
