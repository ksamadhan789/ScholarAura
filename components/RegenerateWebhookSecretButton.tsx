"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Admin button that replaces an event's/competition's Apps Script webhook secret. */
export function RegenerateWebhookSecretButton({ endpoint }: { endpoint: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function regenerate() {
    if (
      !window.confirm(
        "Generate a new secret? The current one stops working immediately — you'll need to paste the new one into the Apps Script's WEBHOOK_SECRET property."
      )
    ) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ text: data.error ?? "Couldn't generate a new secret", isError: true });
        return;
      }
      setMessage({ text: "New secret generated — update the Apps Script now.", isError: false });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={regenerate}
        disabled={loading}
        className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-slate-600"
      >
        {loading ? "Generating…" : "Regenerate secret"}
      </button>
      {message && (
        <span className={`text-xs ${message.isError ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
