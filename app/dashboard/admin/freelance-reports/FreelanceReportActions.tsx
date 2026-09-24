"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function useAdminAction() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(url: string, body?: unknown) {
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
        setError(data?.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
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
        className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm disabled:opacity-50"
      >
        Dismiss
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export function ListingModerationButton({
  listingId,
  action,
}: {
  listingId: string;
  action: "remove" | "restore";
}) {
  const { loading, error, run } = useAdminAction();

  function click() {
    const question =
      action === "remove"
        ? "Remove this listing? It will be hidden, the owner notified, and they won't be able to republish it."
        : "Restore this listing? It stays paused, but the owner will be able to republish it.";
    if (!window.confirm(question)) return;
    run(`/api/admin/freelance-listings/${listingId}`, { action });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={click}
        disabled={loading}
        className={
          action === "remove"
            ? "rounded bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            : "rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm disabled:opacity-50"
        }
      >
        {action === "remove" ? "Remove listing" : "Restore"}
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
