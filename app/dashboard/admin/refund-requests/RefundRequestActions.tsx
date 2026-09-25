"use client";

import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { ConfirmButton, ReasonButton } from "@/components/dashboard/ReasonButton";
import { DASHBOARD_APPROVE_BUTTON_CLASS, DASHBOARD_REJECT_BUTTON_CLASS } from "@/components/dashboard/DashboardShell";

export function RefundRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();

  async function decide(decision: "APPROVE" | "REJECT", rejectionReason?: string): Promise<string | null> {
    try {
      const res = await fetch(`/api/admin/refund-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, rejectionReason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        return data?.error ?? "Something went wrong.";
      }
      router.refresh();
      return null;
    } catch {
      return "Couldn't reach the server. Please try again.";
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-2 sm:justify-end">
      <ConfirmButton
        label="Approve & refund"
        icon={<Check aria-hidden className="h-4 w-4" />}
        className={DASHBOARD_APPROVE_BUTTON_CLASS}
        question="This issues the refund immediately and emails the student. Continue?"
        confirmLabel="Yes, refund"
        onConfirm={() => decide("APPROVE")}
      />
      <ReasonButton
        label="Reject"
        icon={<X aria-hidden className="h-4 w-4" />}
        className={DASHBOARD_REJECT_BUTTON_CLASS}
        title="Reason (shown to the student)"
        placeholder="e.g. The request is outside the 7-day refund window."
        submitLabel="Reject request"
        optional
        onSubmit={(reason) => decide("REJECT", reason || undefined)}
      />
    </div>
  );
}
