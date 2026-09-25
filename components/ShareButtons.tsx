"use client";

import { useEffect, useState } from "react";
import { Check, Link2, Mail, Share2 } from "lucide-react";
import { buildShareLinks, type ShareTarget } from "@/lib/shareLinks";

// Quiet, uniform outline chips with a small brand-coloured dot — a row of
// solid brand colours shouted louder than the page's own call to action.
// Text labels rather than logos: lucide-react ships no brand icons.
const TARGETS: { key: Exclude<ShareTarget, "email">; label: string; dot: string }[] = [
  { key: "whatsapp", label: "WhatsApp", dot: "bg-[#25D366]" },
  { key: "linkedin", label: "LinkedIn", dot: "bg-[#0A66C2]" },
  { key: "x", label: "X", dot: "bg-slate-900 dark:bg-white" },
  { key: "facebook", label: "Facebook", dot: "bg-[#1877F2]" },
];

/**
 * Share row for a public page. `url` must be the absolute public URL
 * (SITE_URL + path). On devices with a native share sheet (most phones) a
 * "Share" button opens it; the direct links are always shown too.
 */
export function ShareButtons({ url, title, label = "Share" }: { url: string; title: string; label?: string }) {
  const links = buildShareLinks({ url, title });
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // Dismissed or unsupported — the direct links below still work.
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  const chip =
    "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {canNativeShare && (
          <button type="button" onClick={nativeShare} className={chip}>
            <Share2 aria-hidden className="h-3.5 w-3.5" />
            Share
          </button>
        )}
        {TARGETS.map((t) => (
          <a
            key={t.key}
            href={links[t.key]}
            target="_blank"
            rel="noopener noreferrer"
            className={chip}
            aria-label={`Share on ${t.label}`}
          >
            <span aria-hidden className={`h-2 w-2 rounded-full ${t.dot}`} />
            {t.label}
          </a>
        ))}
        <a
          href={links.email}
          className={chip}
          aria-label="Share by email"
        >
          <Mail aria-hidden className="h-3.5 w-3.5" />
          Email
        </a>
        <button
          type="button"
          onClick={copyLink}
          className={chip}
        >
          {copied ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Link2 aria-hidden className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
