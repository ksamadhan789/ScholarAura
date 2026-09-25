"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DisconnectDriveButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    if (
      !window.confirm(
        "Disconnect this Google account? Certificate generation will stop working until you reconnect."
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await fetch("/api/admin/google-drive/disconnect", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={run}
      disabled={loading}
      className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      {loading ? "…" : "Disconnect"}
    </button>
  );
}
