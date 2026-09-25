import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ChevronLeft, type LucideIcon } from "lucide-react";

/** White card look shared by the learner dashboard pages. */
export const DASHBOARD_CARD_CLASS =
  "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800";

/**
 * Page frame for the learner's own dashboard pages (My learning, My events,
 * My certificates, …): a "Back to dashboard" link, title, one-line summary
 * and optional actions, on the same light-grey canvas as /dashboard.
 */
export function DashboardShell({
  title,
  description,
  actions,
  backHref = "/dashboard",
  backLabel = "Dashboard",
  narrow = false,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  /** A reading-width column, for single-thread pages like messages. */
  narrow?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950">
      <div className={`mx-auto px-4 py-10 sm:py-12 ${narrow ? "max-w-[860px]" : "max-w-[1200px]"}`}>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400"
        >
          <ChevronLeft aria-hidden className="h-4 w-4" />
          {backLabel}
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{title}</h1>
            {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}

/** Pill tabs driven by a query param — plain links, so they work without JavaScript. */
export function DashboardTabs({
  tabs,
  active,
}: {
  tabs: { key: string; label: string; count: number; href: string }[];
  active: string;
}) {
  return (
    <nav aria-label="Filter" className="mb-6 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 text-xs tabular-nums ${
                isActive ? "bg-white/20" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }`}
            >
              {tab.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardEmptyState({
  icon: Icon,
  title,
  text,
  href,
  cta,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className={`${DASHBOARD_CARD_CLASS} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
        <Icon aria-hidden className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      {text && <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{text}</p>}
      {href && cta && (
        <Link
          href={href}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {cta}
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

/** Small outline button used for secondary row actions (Receipt, Verify, …). */
export const DASHBOARD_SECONDARY_BUTTON_CLASS =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

export const DASHBOARD_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700";

/** White pill button for use on the navy DashboardBanner. */
export const BANNER_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy-900 transition-colors hover:bg-slate-100";

/** Outline pill button for use on the navy DashboardBanner. */
export const BANNER_SECONDARY_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10";

/**
 * The navy welcome banner at the top of each role's home dashboard (learner,
 * recruiter, instructor): a leading visual (avatar / logo tile), an eyebrow,
 * the page's <h1>, a detail line and actions on the right.
 */
export function DashboardBanner({
  leading,
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  leading?: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-navy-900 p-6 text-white sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl"
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {leading}
          <div className="min-w-0">
            {eyebrow && <p className="text-sm font-medium text-sky-300">{eyebrow}</p>}
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-300 sm:truncate">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
}

/** A number + label tile. Links when `href` is given. Always a real count. */
export function DashboardStatCard({
  href,
  icon: Icon,
  value,
  label,
}: {
  href?: string;
  icon: LucideIcon;
  value: number | string;
  label: string;
}) {
  const body = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
        <Icon aria-hidden className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
          {typeof value === "number" ? value.toLocaleString("en-IN") : value}
        </span>
        <span className="block text-sm leading-snug text-slate-500 dark:text-slate-400">{label}</span>
      </span>
    </>
  );
  const className = `${DASHBOARD_CARD_CLASS} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4`;
  return href ? (
    <Link href={href} className={`${className} transition hover:-translate-y-0.5 hover:shadow-md`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
