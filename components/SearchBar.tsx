"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SEARCH_CATEGORIES = [
  { value: "", label: "All" },
  { value: "course", label: "Courses" },
  { value: "event", label: "Events" },
  { value: "competition", label: "Competitions" },
  { value: "job", label: "Jobs" },
] as const;

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const params = new URLSearchParams({ q: trimmed });
    if (category) params.set("type", category);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-w-0 flex-1 max-w-md items-stretch overflow-hidden rounded border border-slate-300 focus-within:border-brand-500 dark:border-slate-600 dark:focus-within:border-brand-400"
    >
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        aria-label="Search category"
        className="w-14 shrink-0 border-r border-slate-300 bg-slate-50 px-1 text-xs text-slate-600 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:w-auto sm:px-2 sm:text-sm"
      >
        {SEARCH_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search…"
        aria-label="Search"
        className="min-w-0 flex-1 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:bg-slate-800 dark:text-white"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex shrink-0 items-center justify-center bg-brand-600 px-3 text-white transition-colors hover:bg-brand-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
