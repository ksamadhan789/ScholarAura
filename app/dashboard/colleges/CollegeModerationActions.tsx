"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CollegeModerationActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function moderate(status: "APPROVED" | "REJECTED") {
    setLoading(status === "APPROVED" ? "approve" : "reject");
    try {
      const res = await fetch(`/api/admin/colleges/${id}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => moderate("APPROVED")}
        disabled={loading !== null}
        className="rounded border border-green-300 dark:border-green-700 px-3 py-1.5 text-sm text-green-700 dark:text-green-400 disabled:opacity-50"
      >
        {loading === "approve" ? "…" : "Approve"}
      </button>
      <button
        onClick={() => moderate("REJECTED")}
        disabled={loading !== null}
        className="rounded border border-red-300 dark:border-red-700 px-3 py-1.5 text-sm text-red-700 dark:text-red-400 disabled:opacity-50"
      >
        {loading === "reject" ? "…" : "Reject"}
      </button>
    </div>
  );
}
