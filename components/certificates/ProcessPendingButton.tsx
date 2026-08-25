"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProcessPendingButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/certificates/process-pending", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Processing failed");
        return;
      }
      setMessage(
        `Processed ${data.processed} (${data.succeeded} succeeded, ${data.failed} failed)` +
          (data.remaining > 0 ? ` — ${data.remaining} still pending, click again` : "")
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={run}
        disabled={loading}
        className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Processing…" : "Process pending"}
      </button>
      {message && <span className="max-w-xs text-right text-xs text-gray-500 dark:text-slate-400">{message}</span>}
    </div>
  );
}
