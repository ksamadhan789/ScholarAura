"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkCompleteButton({
  slug,
  videoId,
  initiallyCompleted,
}: {
  slug: string;
  videoId: string;
  initiallyCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${slug}/videos/${videoId}/progress`, {
        method: "POST",
      });
      if (res.ok) {
        setCompleted(true);
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't mark this lecture complete. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return (
      <p className="rounded bg-green-100 dark:bg-green-900/40 px-4 py-2.5 text-sm text-green-800 dark:text-green-300">
        ✓ Marked complete
      </p>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2.5 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Saving…" : "Mark as complete"}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
