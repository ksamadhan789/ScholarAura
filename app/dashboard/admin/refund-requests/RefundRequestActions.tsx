"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefundRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "APPROVE" | "REJECT") {
    let rejectionReason: string | undefined;
    if (decision === "REJECT") {
      rejectionReason = window.prompt("Reason for rejecting this refund (shown to the student)?") ?? undefined;
      if (rejectionReason === undefined) return;
    } else if (!window.confirm("This will issue the refund immediately. Continue?")) {
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/refund-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, rejectionReason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          onClick={() => decide("APPROVE")}
          disabled={loading}
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Approve &amp; refund
        </button>
        <button
          onClick={() => decide("REJECT")}
          disabled={loading}
          className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
