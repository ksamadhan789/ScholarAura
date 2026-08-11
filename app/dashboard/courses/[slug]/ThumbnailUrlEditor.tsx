"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ThumbnailUrlEditor({
  slug,
  thumbnailUrl,
}: {
  slug: string;
  thumbnailUrl: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(thumbnailUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbnailUrl: value.trim() || null }),
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
    <div className="mt-8">
      <label className="mb-1 block text-sm font-medium">Thumbnail URL (optional)</label>
      <div className="flex items-center gap-2">
        <input
          type="url"
          placeholder="https://..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full max-w-sm rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
        />
        <button
          onClick={save}
          disabled={loading}
          className="rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "…" : "Save"}
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
        Shown as the cover image on the course card. Landscape images work best.
      </p>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
