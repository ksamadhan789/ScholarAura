import type { ReactNode } from "react";

// Soft brand-tinted banner at the top of simple content pages (About,
// Contact, FAQ, …) — a consistent title + intro treatment for the revamp.
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white dark:border-slate-800 dark:from-slate-800 dark:to-slate-900">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:py-16">
        {eyebrow && (
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          {title}
        </h1>
        {children && (
          <div className="mt-3 max-w-2xl text-lg text-slate-600 dark:text-slate-300">{children}</div>
        )}
      </div>
    </div>
  );
}
