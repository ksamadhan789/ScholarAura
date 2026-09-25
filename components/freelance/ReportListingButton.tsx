"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FREELANCE_REPORT_REASONS } from "@/lib/freelanceReportReasons";
import { Flag } from "lucide-react";

// Small "Report" link that expands into an inline form. Logged-out
// visitors are sent to log in first, same as ContactButton.
export function ReportListingButton({ slug, isLoggedIn }: { slug: string; isLoggedIn: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function start() {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/freelance/${slug}`)}`);
      return;
    }
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!reason) {
      setError("Pick a reason for the report.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/freelance/${slug}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't send your report. Please try again.");
        return;
      }
      setDone(true);
      setOpen(false);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-green-700 dark:text-green-400">
        ✅ Thanks — our team will review this listing.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={start}
        className="inline-flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
      >
        <Flag aria-hidden className="h-3.5 w-3.5" />
        Report this listing
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex max-w-md flex-col gap-3 rounded border border-gray-200 dark:border-slate-700 p-4"
    >
      <p className="text-sm font-medium">What&apos;s wrong with this listing?</p>
      <div className="flex flex-col gap-1.5">
        {Object.entries(FREELANCE_REPORT_REASONS).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="reason"
              value={key}
              checked={reason === key}
              onChange={() => setReason(key)}
            />
            {label}
          </label>
        ))}
      </div>
      <textarea
        rows={3}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={2000}
        placeholder="Anything else our team should know? (optional)"
        className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
