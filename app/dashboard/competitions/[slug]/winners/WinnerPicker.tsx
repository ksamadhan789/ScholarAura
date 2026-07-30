"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Entry = { id: string; label: string; rank: number | null };

const RANKS = [
  { rank: 1, medal: "🥇", label: "1st place" },
  { rank: 2, medal: "🥈", label: "2nd place" },
  { rank: 3, medal: "🥉", label: "3rd place" },
] as const;

export function WinnerPicker({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const initial: Record<number, string> = {};
  for (const r of RANKS) {
    const holder = entries.find((e) => e.rank === r.rank);
    initial[r.rank] = holder?.id ?? "";
  }
  const [selection, setSelection] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setRank(entryId: string, rank: number | null) {
    const res = await fetch(`/api/admin/competition-entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rank }),
    });
    if (!res.ok) {
      throw new Error("Couldn't save that winner. Please try again.");
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // Clear every entry that previously held a rank, then re-apply the
      // current selection — avoids two entries ending up with the same rank.
      const previousHolders = entries.filter((e) => e.rank !== null);
      for (const holder of previousHolders) {
        await setRank(holder.id, null);
      }
      for (const r of RANKS) {
        const entryId = selection[r.rank];
        if (entryId) {
          await setRank(entryId, r.rank);
        }
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {RANKS.map((r) => (
        <div key={r.rank}>
          <label className="mb-1 block text-sm font-medium">
            {r.medal} {r.label}
          </label>
          <select
            value={selection[r.rank]}
            onChange={(e) => setSelection((s) => ({ ...s, [r.rank]: e.target.value }))}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
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
        className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-white disabled:opacity-50 self-start"
      >
        {saving ? "Saving…" : "Save winners"}
      </button>
    </div>
  );
}
