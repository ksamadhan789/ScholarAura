"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EventPublishToggle({
  slug,
  isPublished,
}: {
  slug: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm disabled:opacity-50"
    >
      {loading ? "…" : isPublished ? "Unpublish" : "Publish"}
    </button>
  );
}
