"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WithdrawApplicationButton({ jobSlug }: { jobSlug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withdraw() {
    if (!window.confirm("Withdraw this application? You can apply again afterwards if you change your mind.")) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobSlug}/apply`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't withdraw your application.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={withdraw}
        disabled={loading}
        className="rounded border border-red-300 px-3 py-1.5 text-xs text-red-700 disabled:opacity-50 dark:border-red-700 dark:text-red-400"
      >
        {loading ? "Withdrawing…" : "Withdraw application"}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
