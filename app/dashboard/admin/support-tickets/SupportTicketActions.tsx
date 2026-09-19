"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SupportTicketActions({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reply() {
    const adminReply = window.prompt("Your reply (emailed to the person who raised this ticket)?");
    if (!adminReply || !adminReply.trim()) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/support-tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply }),
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
      <button
        onClick={reply}
        disabled={loading}
        className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        Reply &amp; resolve
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
