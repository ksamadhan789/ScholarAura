"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/dashboard/ReasonButton";

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

  async function remove(): Promise<string | null> {
    setError(null);
    try {
      const res = await fetch(`/api/freelance/${slug}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return data.error ?? "Couldn't delete listing";
      router.refresh();
      return null;
    } catch {
      return "Couldn't reach the server.";
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <div className="flex flex-wrap items-start gap-1.5">
        {!removedByAdmin && (
          <button
            type="button"
            onClick={togglePublished}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
              isPublished
                ? "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
            }`}
          >
            {isPublished ? <Pause aria-hidden className="h-4 w-4" /> : <Play aria-hidden className="h-4 w-4" />}
            {loading ? "Saving…" : isPublished ? "Pause" : "Publish"}
          </button>
        )}
        <ConfirmButton
          label="Delete"
          icon={<Trash2 aria-hidden className="h-4 w-4" />}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          question="Delete this listing? This can't be undone."
          confirmLabel="Yes, delete"
          tone="danger"
          disabled={loading}
          onConfirm={remove}
        />
      </div>
      {error && <span className="max-w-[10rem] text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
