import Link from "next/link";
import { MAIN_NAV_ITEMS } from "@/lib/navItems";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-[900px] flex-col items-center px-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
        Error 404
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md text-slate-600 dark:text-slate-400">
        It may have been moved, or the listing may have closed. Try one of these instead:
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {MAIN_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-brand-400"
          >
            <item.icon aria-hidden className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-brand-700"
      >
        Go to the homepage
      </Link>
    </main>
  );
}
