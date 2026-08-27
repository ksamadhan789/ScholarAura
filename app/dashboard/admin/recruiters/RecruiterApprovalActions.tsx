"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RecruiterApprovalActions({ recruiterId }: { recruiterId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: "APPROVED" | "REJECTED") {
    let rejectionReason: string | undefined;
    if (status === "REJECTED") {
      rejectionReason = window.prompt("Reason for rejecting this recruiter (shown to them)?") ?? undefined;
      if (rejectionReason === undefined) return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/recruiters/${recruiterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => updateStatus("APPROVED")}
        disabled={loading}
        className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={() => updateStatus("REJECTED")}
        disabled={loading}
        className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
