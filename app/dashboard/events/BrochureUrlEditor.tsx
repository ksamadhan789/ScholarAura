"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BrochureUrlEditor({
  slug,
  brochureUrl,
}: {
  slug: string;
  brochureUrl: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(brochureUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brochureUrl: value.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="url"
        placeholder="Brochure URL"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-56 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs"
      />
      <button
        onClick={save}
        disabled={loading}
        className="rounded border border-gray-300 dark:border-slate-600 px-2 py-1 text-xs disabled:opacity-50"
      >
        {loading ? "…" : "Save"}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
