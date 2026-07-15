"use client";

import { useState } from "react";

export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access can fail in some browser contexts; link is still selectable text
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-3 py-1.5 text-sm text-white"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
