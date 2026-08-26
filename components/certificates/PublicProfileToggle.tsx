"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PublicProfileToggle({
  initialEnabled,
  portfolioUrl,
}: {
  initialEnabled: boolean;
  portfolioUrl: string;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/public-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (res.ok) {
        setEnabled(!enabled);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail silently (permissions, insecure context) —
      // the link is still visible as plain text for the user to select.
    }
  }

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 dark:border-slate-700 p-4">
      <div>
        <p className="font-medium">🔗 Shareable certificate portfolio</p>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {enabled
            ? "Anyone with the link below can view your generated certificates."
            : "Turn this on to get a public link showing all your generated certificates — handy for a resume or LinkedIn."}
        </p>
        {enabled && (
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded bg-gray-100 dark:bg-slate-800 px-2 py-1 text-xs">{portfolioUrl}</code>
            <button onClick={copyLink} className="text-xs text-brand-600 hover:underline">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm disabled:opacity-50"
      >
        {loading ? "…" : enabled ? "Make private" : "Make public"}
      </button>
    </div>
  );
}
