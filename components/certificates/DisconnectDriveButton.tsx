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
      className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-xs disabled:opacity-50"
    >
      {loading ? "…" : "Disconnect"}
    </button>
  );
}
