"use client";

import { useEffect, useState } from "react";
import { Check, Link2, Mail, Share2 } from "lucide-react";
import { buildShareLinks, type ShareTarget } from "@/lib/shareLinks";

// Brand-coloured text chips rather than logos — lucide-react ships no brand
// icons, and a label can't render wrong.
const TARGETS: { key: Exclude<ShareTarget, "email">; label: string; className: string }[] = [
  { key: "whatsapp", label: "WhatsApp", className: "bg-[#25D366] text-white hover:bg-[#1ebe5b]" },
  { key: "linkedin", label: "LinkedIn", className: "bg-[#0A66C2] text-white hover:bg-[#0957a5]" },
  { key: "x", label: "X", className: "bg-black text-white hover:bg-slate-800 dark:bg-slate-950" },
  { key: "facebook", label: "Facebook", className: "bg-[#1877F2] text-white hover:bg-[#0f66d9]" },
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

  const chip = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors";

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {canNativeShare && (
          <button type="button" onClick={nativeShare} className={`${chip} bg-brand-600 text-white hover:bg-brand-700`}>
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
            className={`${chip} ${t.className}`}
            aria-label={`Share on ${t.label}`}
          >
            {t.label}
          </a>
        ))}
        <a
          href={links.email}
          className={`${chip} bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600`}
          aria-label="Share by email"
        >
          <Mail aria-hidden className="h-3.5 w-3.5" />
          Email
        </a>
        <button
          type="button"
          onClick={copyLink}
          className={`${chip} bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600`}
        >
          {copied ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Link2 aria-hidden className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
