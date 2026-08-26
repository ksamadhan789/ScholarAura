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
          className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {downloading ? "Zipping…" : "Download all (zip)"}
        </button>
        <button
          onClick={resendAll}
          disabled={resending}
          className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend all emails"}
        </button>
      </div>
      {message && <span className="max-w-xs text-right text-xs text-gray-500 dark:text-slate-400">{message}</span>}
    </div>
  );
}
