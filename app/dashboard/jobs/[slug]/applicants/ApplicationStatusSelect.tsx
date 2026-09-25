"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JOB_APPLICATION_STATUS_LABELS } from "@/lib/jobLabels";

// Colour the control by the current status so a list of applicants scans at a glance.
const STATUS_STYLE: Record<string, string> = {
  APPLIED: "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300",
  SHORTLISTED:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  HIRED:
    "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200",
  REJECTED: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

export function ApplicationStatusSelect({ applicationId, status }: { applicationId: string; status: string }) {
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
      aria-label="Application status"
      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 ${
        STATUS_STYLE[status] ?? STATUS_STYLE.APPLIED
      }`}
    >
      {Object.entries(JOB_APPLICATION_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
