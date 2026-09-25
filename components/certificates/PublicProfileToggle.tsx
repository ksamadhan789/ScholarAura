"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Globe, Lock } from "lucide-react";

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
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between dark:border-slate-700 dark:bg-slate-800">
      <div className="flex min-w-0 gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
          {enabled ? <Globe aria-hidden className="h-5 w-5" /> : <Lock aria-hidden className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900 dark:text-white">
            Shareable certificate portfolio
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                enabled
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {enabled ? "Public" : "Private"}
            </span>
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {enabled
              ? "Anyone with the link below can view your generated certificates."
              : "Turn this on to get a public link showing all your generated certificates — handy for a resume or LinkedIn."}
          </p>
          {enabled && (
            <div className="mt-3 flex max-w-full flex-wrap items-center gap-2">
              <code className="max-w-full truncate rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {portfolioUrl}
              </code>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-slate-700"
              >
                {copied ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-slate-700"
              >
                <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                View
              </a>
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
          enabled
            ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            : "bg-brand-600 text-white hover:bg-brand-700"
        }`}
      >
        {loading ? "Saving…" : enabled ? "Make private" : "Make public"}
      </button>
    </div>
  );
}
