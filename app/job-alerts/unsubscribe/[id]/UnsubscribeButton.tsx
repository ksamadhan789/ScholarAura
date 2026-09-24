"use client";

import { useState } from "react";
import Link from "next/link";

export function UnsubscribeButton({ id, alreadyStopped }: { id: string; alreadyStopped: boolean }) {
  const [done, setDone] = useState(alreadyStopped);
  const [loading, setLoading] = useState(false);

  async function stop() {
    setLoading(true);
    try {
      const res = await fetch(`/api/job-alerts/${id}/unsubscribe`, { method: "POST" });
      if (res.ok) setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return done ? (
    <p className="text-slate-700 dark:text-slate-300">
      This alert is stopped — you won&apos;t get more emails for it.{" "}
      <Link href="/dashboard/job-alerts" className="text-brand-600 underline dark:text-brand-400">
        Manage all alerts
      </Link>
    </p>
  ) : (
    <button
      type="button"
      onClick={stop}
      disabled={loading}
      className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
    >
      {loading ? "Stopping…" : "Stop emails for this alert"}
    </button>
  );
}
