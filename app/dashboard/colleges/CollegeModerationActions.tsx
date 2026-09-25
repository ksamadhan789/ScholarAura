"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { DASHBOARD_APPROVE_BUTTON_CLASS, DASHBOARD_REJECT_BUTTON_CLASS } from "@/components/dashboard/DashboardShell";

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
        type="button"
        className={DASHBOARD_APPROVE_BUTTON_CLASS}
      >
        <Check aria-hidden className="h-4 w-4" />
        {loading === "approve" ? "Approving…" : "Approve"}
      </button>
      <button
        onClick={() => moderate("REJECTED")}
        disabled={loading !== null}
        type="button"
        className={DASHBOARD_REJECT_BUTTON_CLASS}
      >
        <X aria-hidden className="h-4 w-4" />
        {loading === "reject" ? "Rejecting…" : "Reject"}
      </button>
    </div>
  );
}
