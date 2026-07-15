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

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${slug}/videos/${videoId}/progress`, {
        method: "POST",
      });
      if (res.ok) {
        setCompleted(true);
        router.refresh();
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
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2.5 text-sm text-white disabled:opacity-50"
    >
      {loading ? "Saving…" : "Mark as complete"}
    </button>
  );
}
