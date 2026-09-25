"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, RotateCcw } from "lucide-react";

export function RequestRefundButton({
  kind,
  itemId,
  isPending,
}: {
  kind: "course" | "event" | "competition";
  itemId: string;
  isPending: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
        <Clock aria-hidden className="h-3.5 w-3.5" />
        Refund requested — pending review
      </span>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (reason.trim().length < 10) {
      setError("Please explain a bit more (at least 10 characters).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/refund-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, itemId, reason: reason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't submit your request. Please try again.");
        return;
      }
      setOpen(false);
      setReason("");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (open) {
    return (
      <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:w-64">
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you requesting a refund?"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit request"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-gray-500 hover:underline dark:text-slate-400"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      type="button"
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
    >
      <RotateCcw aria-hidden className="h-4 w-4" />
      Request refund
    </button>
  );
}
