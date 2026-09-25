"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { ReasonButton } from "@/components/dashboard/ReasonButton";
import { DASHBOARD_APPROVE_BUTTON_CLASS, DASHBOARD_REJECT_BUTTON_CLASS } from "@/components/dashboard/DashboardShell";

export function RecruiterApprovalActions({ recruiterId }: { recruiterId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: "APPROVED" | "REJECTED", rejectionReason?: string): Promise<string | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/recruiters/${recruiterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        return data?.error ?? "Something went wrong.";
      }
      router.refresh();
      return null;
    } catch {
      return "Couldn't reach the server. Please try again.";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-start gap-2 sm:justify-end">
        <button
          type="button"
          onClick={async () => setError(await updateStatus("APPROVED"))}
          disabled={loading}
          className={DASHBOARD_APPROVE_BUTTON_CLASS}
        >
          <Check aria-hidden className="h-4 w-4" />
          Approve
        </button>
        <ReasonButton
          label="Reject"
          icon={<X aria-hidden className="h-4 w-4" />}
          className={DASHBOARD_REJECT_BUTTON_CLASS}
          disabled={loading}
          title="Reason (shown to the recruiter)"
          placeholder="e.g. We couldn't verify the company website."
          submitLabel="Reject recruiter"
          optional
          onSubmit={(reason) => updateStatus("REJECTED", reason || undefined)}
        />
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
