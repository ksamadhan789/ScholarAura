"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SEARCH_TYPES = [
  { value: "all", label: "All" },
  { value: "courses", label: "Courses" },
  { value: "events", label: "Events" },
  { value: "competitions", label: "Competitions" },
  { value: "jobs", label: "Jobs" },
  { value: "bundles", label: "Bundles" },
];

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const params = new URLSearchParams({ q: trimmed });
    if (type !== "all") params.set("type", type);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 max-w-md flex-1 items-stretch">
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        aria-label="Search category"
        className="w-24 shrink-0 rounded-l border border-r-0 border-slate-300 bg-slate-50 px-1.5 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
      >
        {SEARCH_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search…"
        aria-label="Search"
        className="min-w-0 flex-1 border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      />
      <button
        type="submit"
        aria-label="Search"
        className="shrink-0 rounded-r border border-l-0 border-brand-600 bg-brand-600 px-3 text-white transition-colors hover:bg-brand-700"
      >
        🔍
      </button>
    </form>
  );
}
