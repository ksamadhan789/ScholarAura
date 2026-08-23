"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncAttendanceButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/events/${slug}/sync-attendance`, { method: "POST" });
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
        className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm disabled:opacity-50"
      >
        {loading ? "Syncing…" : "Sync attendance"}
      </button>
      {message && <span className="max-w-xs text-right text-xs text-gray-500 dark:text-slate-400">{message}</span>}
    </div>
  );
}
