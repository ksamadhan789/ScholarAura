import { CountdownTimer } from "@/components/CountdownTimer";
import { formatDateTime } from "@/lib/eventLabels";

export type DateMilestone = {
  label: string;
  date: Date;
  /** Gets the accent border/background plus a live countdown underneath. */
  emphasize?: boolean;
};

/** A row of milestone-date cards (registration deadline, submission deadline, result date, ...). The emphasized one gets a live CountdownTimer computed from its own real date. */
export function DateCards({ milestones }: { milestones: DateMilestone[] }) {
  if (milestones.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Important dates</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {milestones.map((m) => (
          <div
            key={m.label}
            className={`rounded-2xl border p-5 shadow-sm ${
              m.emphasize
                ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-slate-800"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {m.label}
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
              {formatDateTime(m.date)}
            </p>
            {m.emphasize && (
              <div className="mt-3 border-t border-brand-200 pt-3 dark:border-brand-800">
                <CountdownTimer deadline={m.date.toISOString()} closedLabel="Closed" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
