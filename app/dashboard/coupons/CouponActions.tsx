"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/dashboard/ReasonButton";

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

  async function remove(): Promise<string | null> {
    setError(null);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return data.error ?? "Couldn't delete coupon";
      router.refresh();
      return null;
    } catch {
      return "Couldn't reach the server.";
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1.5">
        <button
          type="button"
          onClick={toggleActive}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {isActive ? <Pause aria-hidden className="h-3.5 w-3.5" /> : <Play aria-hidden className="h-3.5 w-3.5" />}
          {loading ? "Saving…" : isActive ? "Deactivate" : "Activate"}
        </button>
        {redemptionCount === 0 && (
          <ConfirmButton
            label="Delete"
            icon={<Trash2 aria-hidden className="h-3.5 w-3.5" />}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            question="Delete this coupon? This can't be undone."
            confirmLabel="Yes, delete"
            tone="danger"
            disabled={loading}
            onConfirm={remove}
          />
        )}
      </div>
      {error && <span className="max-w-[10rem] text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
