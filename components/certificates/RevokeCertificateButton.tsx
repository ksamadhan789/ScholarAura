"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RevokeCertificateButton({ code }: { code: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (
      !window.confirm("Revoke this certificate? It will fail public verification until restored.")
    ) {
      return;
    }
    const reason = window.prompt("Reason (optional):") ?? undefined;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/certificates/${code}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        {loading ? "…" : "Revoke"}
      </button>
      {error && <span className="max-w-[10rem] text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
