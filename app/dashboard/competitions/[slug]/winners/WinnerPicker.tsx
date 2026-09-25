"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Entry = { id: string; label: string; rank: number | null };

const RANKS = [
  { rank: 1, medal: "bg-amber-400 text-amber-950", label: "1st place" },
  { rank: 2, medal: "bg-slate-300 text-slate-800", label: "2nd place" },
  { rank: 3, medal: "bg-orange-300 text-orange-950", label: "3rd place" },
] as const;

export function WinnerPicker({ slug, entries }: { slug: string; entries: Entry[] }) {
  const router = useRouter();
  const initial: Record<number, string> = {};
  for (const r of RANKS) {
    const holder = entries.find((e) => e.rank === r.rank);
    initial[r.rank] = holder?.id ?? "";
  }
  const [selection, setSelection] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const selections = RANKS.map((r) => ({ rank: r.rank, entryId: selection[r.rank] || null }));
      const res = await fetch(`/api/admin/competitions/${slug}/winners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Couldn't save winners. Please try again.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-800">
      {RANKS.map((r) => (
        <div key={r.rank}>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span
              aria-hidden
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${r.medal}`}
            >
              {r.rank}
            </span>
            {r.label}
          </label>
          <select
            value={selection[r.rank]}
            onChange={(e) => setSelection((s) => ({ ...s, [r.rank]: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          >
            <option value="">— none —</option>
            {entries.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save winners"}
      </button>
    </div>
  );
}
