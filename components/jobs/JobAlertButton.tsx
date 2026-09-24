"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BellRing } from "lucide-react";
import { describeJobAlert, type JobAlertFilters } from "@/lib/jobAlertLabels";

// "Email me new jobs like these" for the current /jobs search. Logged-out
// visitors are sent to log in first and come back to the same search.
export function JobAlertButton({
  filters,
  isLoggedIn,
  returnPath,
}: {
  filters: JobAlertFilters;
  isLoggedIn: boolean;
  returnPath: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(returnPath)}`);
      return;
    }
    setError(null);
    setState("saving");
    try {
      const res = await fetch("/api/job-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save the alert. Please try again.");
        setState("idle");
        return;
      }
      setState("saved");
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setState("idle");
    }
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
      {state === "saved" ? (
        <div className="text-sm">
          <p className="flex items-center gap-2 font-semibold text-brand-700 dark:text-brand-300">
            <BellRing aria-hidden className="h-4 w-4" />
            Alert saved
          </p>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            We&apos;ll email you new jobs like these once a day.{" "}
            <Link href="/dashboard/job-alerts" className="font-medium text-brand-600 underline dark:text-brand-400">
              Manage alerts
            </Link>
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Get new jobs by email</p>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{describeJobAlert(filters)}</p>
          <button
            type="button"
            onClick={save}
            disabled={state === "saving"}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            <Bell aria-hidden className="h-4 w-4" />
            {state === "saving" ? "Saving…" : "Create job alert"}
          </button>
          {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </div>
  );
}
