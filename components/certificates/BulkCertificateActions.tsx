"use client";

import { useState } from "react";

export function BulkCertificateActions({
  eventId,
  competitionId,
}: {
  eventId?: string;
  competitionId?: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const query = eventId ? `eventId=${eventId}` : `competitionId=${competitionId}`;

  async function downloadZip() {
    setDownloading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/certificates/bulk-zip?${query}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? "Couldn't download certificates");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certificates.zip";
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+)"/);
      if (match) a.download = match[1];
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  async function resendAll() {
    if (!window.confirm("Resend the certificate-ready email to everyone with a generated certificate?")) return;
    setResending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/certificates/bulk-resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventId ? { eventId } : { competitionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Couldn't resend emails");
        return;
      }
      setMessage(`Sent ${data.sent}/${data.total} emails` + (data.failed > 0 ? ` (${data.failed} failed)` : ""));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          onClick={downloadZip}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {downloading ? "Zipping…" : "Download all (zip)"}
        </button>
        <button
          onClick={resendAll}
          disabled={resending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {resending ? "Sending…" : "Resend all emails"}
        </button>
      </div>
      {message && <span className="max-w-xs text-right text-xs text-slate-500 dark:text-slate-400">{message}</span>}
    </div>
  );
}
