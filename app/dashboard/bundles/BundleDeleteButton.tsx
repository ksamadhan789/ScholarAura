"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BundleDeleteButton({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bundles/${slug}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="rounded border border-red-300 px-2.5 py-1 text-xs text-red-700 disabled:opacity-50 dark:border-red-700 dark:text-red-400"
    >
      {loading ? "…" : "Delete"}
    </button>
  );
}
