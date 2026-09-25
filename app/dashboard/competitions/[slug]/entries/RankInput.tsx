"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RankInput({
  entryId,
  initialRank,
}: {
  entryId: string;
  initialRank: number | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialRank?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const rank = value.trim() === "" ? null : parseInt(value, 10);
      const res = await fetch(`/api/admin/competition-entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rank }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <input
      type="number"
      min="1"
      placeholder="—"
      value={value}
      disabled={loading}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white disabled:opacity-50"
    />
  );
}
