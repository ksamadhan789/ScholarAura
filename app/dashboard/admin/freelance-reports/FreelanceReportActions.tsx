"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Undo2, X } from "lucide-react";
import { ConfirmButton } from "@/components/dashboard/ReasonButton";
import { DASHBOARD_SECONDARY_BUTTON_CLASS } from "@/components/dashboard/DashboardShell";

function useAdminAction() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(url: string, body?: unknown): Promise<string | null> {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.error ?? "Something went wrong.";
        setError(message);
        return message;
      }
      router.refresh();
      return null;
    } catch {
      setError("Couldn't reach the server.");
      return "Couldn't reach the server.";
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, run };
}

export function DismissReportButton({ reportId }: { reportId: string }) {
  const { loading, error, run } = useAdminAction();
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => run(`/api/admin/freelance-reports/${reportId}`)}
        disabled={loading}
        type="button"
        className={DASHBOARD_SECONDARY_BUTTON_CLASS}
      >
        <X aria-hidden className="h-4 w-4" />
        Dismiss
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export function ListingModerationButton({ listingId, action }: { listingId: string; action: "remove" | "restore" }) {
  const { run } = useAdminAction();
  const remove = action === "remove";

  return (
    <ConfirmButton
      label={remove ? "Remove listing" : "Restore"}
      icon={remove ? <Trash2 aria-hidden className="h-4 w-4" /> : <Undo2 aria-hidden className="h-4 w-4" />}
      className={
        remove
          ? "inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          : DASHBOARD_SECONDARY_BUTTON_CLASS
      }
      question={
        remove
          ? "Remove this listing? It will be hidden, the owner notified, and they won't be able to republish it."
          : "Restore this listing? It stays paused, but the owner will be able to republish it."
      }
      confirmLabel={remove ? "Yes, remove" : "Yes, restore"}
      tone={remove ? "danger" : "approve"}
      onConfirm={() => run(`/api/admin/freelance-listings/${listingId}`, { action })}
    />
  );
}
