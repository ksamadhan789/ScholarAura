const RANKS = [
  { key: "first" as const, medal: "🥇", label: "First Prize", accent: "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20" },
  { key: "second" as const, medal: "🥈", label: "Second Prize", accent: "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800" },
  { key: "third" as const, medal: "🥉", label: "Third Prize", accent: "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20" },
];

/** Three visually distinct prize cards — only ranks with a real value render. Reused by competitions and events, which share the same prizeFirst/Second/Third + prizeDescription shape. */
export function PrizeCards({
  first,
  second,
  third,
  description,
}: {
  first?: string | null;
  second?: string | null;
  third?: string | null;
  description?: string | null;
}) {
  const values = { first, second, third };
  const entries = RANKS.filter((r) => values[r.key]);

  if (entries.length === 0 && !description) return null;

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Prizes</h2>
      {entries.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {entries.map((rank) => (
            <div
              key={rank.key}
              className={`rounded-2xl border p-5 text-center shadow-sm ${rank.accent}`}
            >
              <span aria-hidden className="text-3xl">
                {rank.medal}
              </span>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {rank.label}
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{values[rank.key]}</p>
            </div>
          ))}
        </div>
      )}
      {description && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      )}
    </div>
  );
}
