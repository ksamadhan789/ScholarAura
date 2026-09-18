const TONE_STYLES = {
  default: {
    card: "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800",
    title: "text-slate-900 dark:text-white",
    body: "text-slate-600 dark:text-slate-300",
  },
  amber: {
    card: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20",
    title: "text-amber-900 dark:text-amber-200",
    body: "text-amber-800 dark:text-amber-300",
  },
  success: {
    card: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
    title: "text-green-900 dark:text-green-200",
    body: "text-green-800 dark:text-green-300",
  },
} as const;

/** A rounded, shadowed card for a labeled block of detail-page info (dates, prizes, winners, requirements). */
export function InfoCard({
  icon,
  title,
  tone = "default",
  children,
}: {
  icon?: string;
  title: string;
  tone?: keyof typeof TONE_STYLES;
  children: React.ReactNode;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div className={`rounded-2xl border p-5 text-sm shadow-sm ${styles.card}`}>
      <p className={`font-semibold ${styles.title}`}>
        {icon && (
          <span aria-hidden className="mr-1.5">
            {icon}
          </span>
        )}
        {title}
      </p>
      <div className={`mt-2 flex flex-col gap-1.5 ${styles.body}`}>{children}</div>
    </div>
  );
}
