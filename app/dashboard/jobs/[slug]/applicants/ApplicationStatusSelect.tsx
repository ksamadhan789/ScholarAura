"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JOB_APPLICATION_STATUS_LABELS } from "@/lib/jobLabels";

export function ApplicationStatusSelect({
  applicationId,
  status,
}: {
  applicationId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/job-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded border border-gray-300 dark:border-slate-600 px-2 py-1 text-sm dark:bg-slate-800 dark:text-white disabled:opacity-50"
    >
      {Object.entries(JOB_APPLICATION_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
