"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelRegistrationButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${slug}/register`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't cancel. Please try again.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs text-gray-500 dark:text-slate-400">Cancel your registration?</p>
        <div className="flex gap-3">
          <button
            onClick={cancel}
            disabled={loading}
            className="text-xs text-red-600 hover:underline dark:text-red-400 disabled:opacity-50"
          >
            {loading ? "Cancelling…" : "Yes, cancel"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-xs text-gray-500 hover:underline dark:text-slate-400"
          >
            Never mind
          </button>
        </div>
        {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="self-start text-xs text-gray-500 hover:underline dark:text-slate-400"
    >
      Cancel registration
    </button>
  );
}
