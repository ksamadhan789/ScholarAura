"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/dashboard/ReasonButton";
import { DASHBOARD_SECONDARY_BUTTON_CLASS } from "@/components/dashboard/DashboardShell";

export function JobAlertActions({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run(init: RequestInit): Promise<string | null> {
    setLoading(true);
    try {
      const res = await fetch(`/api/job-alerts/${id}`, init);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        return data?.error ?? "Something went wrong.";
      }
      router.refresh();
      return null;
    } catch {
      return "Couldn't reach the server.";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() =>
          run({
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !isActive }),
          })
        }
        className={DASHBOARD_SECONDARY_BUTTON_CLASS}
      >
        {isActive ? <Pause aria-hidden className="h-4 w-4" /> : <Play aria-hidden className="h-4 w-4" />}
        {isActive ? "Pause" : "Resume"}
      </button>
      <ConfirmButton
        label="Delete"
        icon={<Trash2 aria-hidden className="h-4 w-4" />}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        question="Delete this job alert?"
        confirmLabel="Yes, delete"
        tone="danger"
        disabled={loading}
        onConfirm={() => run({ method: "DELETE" })}
      />
    </div>
  );
}
