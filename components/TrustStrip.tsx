const AUDIENCES = [
  { icon: "🎓", label: "Students" },
  { icon: "👥", label: "Faculty" },
  { icon: "📖", label: "Researchers" },
  { icon: "💼", label: "Professionals" },
  { icon: "🏛", label: "Institutions" },
];

export function TrustStrip() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Built for the academic community
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {AUDIENCES.map((a) => (
            <span
              key={a.label}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              <span aria-hidden>{a.icon}</span>
              {a.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
