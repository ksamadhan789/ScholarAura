"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FreelanceListingActions({
  slug,
  isPublished,
  removedByAdmin,
}: {
  slug: string;
  isPublished: boolean;
  removedByAdmin: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function togglePublished() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/freelance/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't update listing");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this listing? This can't be undone.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/freelance/${slug}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't delete listing");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        {!removedByAdmin && (
          <button
            onClick={togglePublished}
            disabled={loading}
            className="rounded border border-gray-300 dark:border-slate-600 px-2.5 py-1 text-xs disabled:opacity-50"
          >
            {loading ? "…" : isPublished ? "Pause" : "Publish"}
          </button>
        )}
        <button
          onClick={remove}
          disabled={loading}
          className="rounded border border-red-300 px-2.5 py-1 text-xs text-red-700 disabled:opacity-50 dark:border-red-700 dark:text-red-400"
        >
          Delete
        </button>
      </div>
      {error && <span className="max-w-[10rem] text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
