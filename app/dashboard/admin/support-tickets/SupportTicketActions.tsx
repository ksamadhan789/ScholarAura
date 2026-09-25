"use client";

import { useRouter } from "next/navigation";
import { Reply } from "lucide-react";
import { ReasonButton } from "@/components/dashboard/ReasonButton";
import { DASHBOARD_PRIMARY_BUTTON_CLASS } from "@/components/dashboard/DashboardShell";

export function SupportTicketActions({ ticketId }: { ticketId: string }) {
  const router = useRouter();

  async function reply(adminReply: string): Promise<string | null> {
    try {
      const res = await fetch(`/api/admin/support-tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply }),
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
    <ReasonButton
      label="Reply & resolve"
      icon={<Reply aria-hidden className="h-4 w-4" />}
      className={`${DASHBOARD_PRIMARY_BUTTON_CLASS} shrink-0 py-1.5`}
      title="Your reply (emailed to the person who raised this ticket)"
      placeholder="Hi, thanks for asking…"
      submitLabel="Send & resolve"
      onSubmit={reply}
    />
  );
}
