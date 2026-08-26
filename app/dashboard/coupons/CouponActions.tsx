"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CouponActions({
  id,
  isActive,
  redemptionCount,
}: {
  id: string;
  isActive: boolean;
  redemptionCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this coupon? This can't be undone.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't delete coupon");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        <button
          onClick={toggleActive}
          disabled={loading}
          className="rounded border border-gray-300 dark:border-slate-600 px-2.5 py-1 text-xs disabled:opacity-50"
        >
          {loading ? "…" : isActive ? "Deactivate" : "Activate"}
        </button>
        {redemptionCount === 0 && (
          <button
            onClick={remove}
            disabled={loading}
            className="rounded border border-red-300 px-2.5 py-1 text-xs text-red-700 disabled:opacity-50 dark:border-red-700 dark:text-red-400"
          >
            Delete
          </button>
        )}
      </div>
      {error && <span className="max-w-[10rem] text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
