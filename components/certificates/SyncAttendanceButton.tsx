"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncAttendanceButton({ syncUrl }: { syncUrl: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(syncUrl, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Sync failed");
        return;
      }
      setMessage(`Matched ${data.matched}, unmatched ${data.unmatched}, skipped ${data.skipped ?? 0}`);
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
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        {loading ? "Syncing…" : "Sync attendance"}
      </button>
      {message && <span className="max-w-xs text-right text-xs text-slate-500 dark:text-slate-400">{message}</span>}
    </div>
  );
}
