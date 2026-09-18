import Link from "next/link";

const pillClassName = (active: boolean) =>
  `rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
    active
      ? "bg-brand-600 text-white"
      : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
  }`;

type FilterPillProps = {
  active: boolean;
  children: React.ReactNode;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

/** A single rounded pill — either a query-param link (for server-rendered filter pages) or a button (for client-side filtering). */
export function FilterPill({ active, children, href, onClick }: FilterPillProps) {
  if (href) {
    return (
      <Link href={href} className={pillClassName(active)}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={pillClassName(active)}>
      {children}
    </button>
  );
}

/** The light-blue tinted strip that groups a row of FilterPills. */
export function FilterPillBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap gap-2 rounded-2xl bg-brand-50 p-3 dark:bg-slate-800/60">
      {children}
    </div>
  );
}
