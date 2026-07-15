const VARIANTS = {
  success: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  brand: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
} as const;

export function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  );
}
