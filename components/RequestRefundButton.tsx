"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <span className="rounded bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-300">
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
          className="w-full rounded border border-gray-300 dark:border-slate-600 px-2 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-3 py-1 text-xs text-white disabled:opacity-50"
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
      className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-xs"
    >
      Request refund
    </button>
  );
}
