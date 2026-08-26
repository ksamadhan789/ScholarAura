"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WaitlistButton({ slug, isWaitlisted }: { slug: string; isWaitlisted: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${slug}/waitlist`, {
        method: isWaitlisted ? "DELETE" : "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (isWaitlisted) {
    return (
      <div className="flex flex-col gap-1">
        <p className="rounded bg-amber-100 dark:bg-amber-900/40 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
          ⏳ You&apos;re on the waitlist — we&apos;ll email you if a seat opens up.
        </p>
        <button onClick={toggle} disabled={loading} className="self-start text-xs text-gray-500 hover:underline dark:text-slate-400">
          {loading ? "…" : "Leave waitlist"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={toggle}
        disabled={loading}
        className="rounded border border-gray-300 dark:border-slate-600 px-5 py-2.5 text-sm disabled:opacity-50"
      >
        {loading ? "…" : "Join waitlist"}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
