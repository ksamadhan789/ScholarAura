import Link from "next/link";
import type { ReactNode } from "react";
import { CollapsibleFilters } from "./CollapsibleFilters";

// Shared layout pieces for the public listing pages (/courses, /events,
// /competitions, /jobs, /freelance): a title band, a two-column shell with a
// filter sidebar on desktop (stacked above the results on phones), and
// consistent filter controls, section headings and empty states.

/** Tailwind classes for a text input / select inside a filter panel. */
export const FILTER_FIELD_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-brand-900/40";

export function ListingHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 bg-gradient-to-br from-brand-50 via-white to-sky-50 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-4 px-4 py-8 sm:py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-slate-600 dark:text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function ListingShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="min-w-0 lg:sticky lg:top-32 lg:self-start">
        <CollapsibleFilters>{sidebar}</CollapsibleFilters>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** The sidebar card. Pass `action` to make it a GET form submitting to that page. */
export function FilterPanel({ action, children }: { action?: string; children: ReactNode }) {
  const className =
    "flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/60";
  return action ? (
    <form action={action} className={className}>
      {children}
    </form>
  ) : (
    <div className={className}>{children}</div>
  );
}

export function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      {children}
    </div>
  );
}

const optionClass = (active: boolean) =>
  `flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
    active
      ? "bg-brand-600 font-medium text-white"
      : "bg-slate-100 text-slate-700 hover:bg-slate-200 lg:bg-transparent lg:hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 lg:dark:bg-transparent dark:hover:bg-slate-700"
  }`;

/** Filter choices — wrapping chips on phones, a vertical list in the desktop sidebar. Links (server-filtered pages) or buttons (client-filtered). */
export function FilterOptionList({ children }: { children: ReactNode }) {
  return <div className="flex flex-row flex-wrap gap-1.5 lg:flex-col lg:gap-1">{children}</div>;
}

export function FilterOption({
  active,
  children,
  href,
  onClick,
}: { active: boolean; children: ReactNode } & (
  | { href: string; onClick?: never }
  | { href?: never; onClick: () => void }
)) {
  const className = `${optionClass(active)} lg:w-full`;
  return href ? (
    <Link href={href} className={className} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className} aria-pressed={active}>
      {children}
    </button>
  );
}

export function FilterActions({ clearHref }: { clearHref?: string }) {
  return (
    <div className="flex gap-2">
      <button
        type="submit"
        className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Apply filters
      </button>
      {clearHref && (
        <Link
          href={clearHref}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Clear
        </Link>
      )}
    </div>
  );
}

export function ResultsSection({
  title,
  count,
  children,
}: {
  title?: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section>
      {title && (
        <h2 className="mb-4 flex items-baseline gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          {title}
          {count !== undefined && (
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{count}</span>
          )}
        </h2>
      )}
      {children}
    </section>
  );
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function EmptyState({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-800/40">
      <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {text && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
