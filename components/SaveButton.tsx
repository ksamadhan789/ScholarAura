"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Generalizes components/courses/WishlistButton.tsx (kept as-is to avoid
// touching tested course UI) to any saveable resource — the caller supplies
// the wishlist endpoint directly instead of this component building a
// courses-specific URL from a slug.
export function SaveButton({
  endpoint,
  isSaved,
  variant = "default",
}: {
  endpoint: string;
  isSaved: boolean;
  variant?: "default" | "overlay";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: isSaved ? "DELETE" : "POST",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (variant === "overlay") {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={isSaved ? "Remove from saved" : "Save for later"}
        aria-pressed={isSaved}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm transition-transform hover:scale-110 disabled:opacity-50 dark:bg-slate-900/90"
      >
        {isSaved ? "❤️" : "🤍"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-pressed={isSaved}
      className="flex items-center gap-1.5 rounded border border-gray-300 dark:border-slate-600 px-4 py-2.5 text-sm disabled:opacity-50"
    >
      {isSaved ? "❤️ Saved" : "🤍 Save for later"}
    </button>
  );
}
