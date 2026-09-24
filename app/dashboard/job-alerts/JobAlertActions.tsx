"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JobAlertActions({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run(init: RequestInit) {
    setLoading(true);
    try {
      await fetch(`/api/job-alerts/${id}`, init);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
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
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 disabled:opacity-50"
      >
        {isActive ? "Pause" : "Resume"}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          if (window.confirm("Delete this job alert?")) run({ method: "DELETE" });
        }}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 dark:border-red-700 dark:text-red-400 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
