"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WishlistButton({
  slug,
  isWishlisted,
  variant = "default",
}: {
  slug: string;
  isWishlisted: boolean;
  variant?: "default" | "overlay";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${slug}/wishlist`, {
        method: isWishlisted ? "DELETE" : "POST",
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
        aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={isWishlisted}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm transition-transform hover:scale-110 disabled:opacity-50 dark:bg-slate-900/90"
      >
        {isWishlisted ? "❤️" : "🤍"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-pressed={isWishlisted}
      className="flex items-center gap-1.5 rounded border border-gray-300 dark:border-slate-600 px-4 py-2.5 text-sm disabled:opacity-50"
    >
      {isWishlisted ? "❤️ Saved" : "🤍 Save for later"}
    </button>
  );
}
