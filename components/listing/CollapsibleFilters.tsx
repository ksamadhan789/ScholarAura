"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

// On phones the filter sidebar sits above the results, so it starts folded
// behind a "Filters" button instead of pushing every result below the fold.
// From the lg breakpoint up it's always shown as the sidebar.
export function CollapsibleFilters({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm lg:hidden dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      >
        <SlidersHorizontal aria-hidden className="h-4 w-4" />
        {open ? "Hide filters" : "Search & filters"}
      </button>
      <div className={open ? "mt-3 lg:mt-0" : "hidden lg:block"}>{children}</div>
    </>
  );
}
