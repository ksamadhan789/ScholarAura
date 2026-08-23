"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CertificateActionButton({
  code,
  action,
  label,
}: {
  code: string;
  action: "generate" | "regenerate" | "restore";
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/certificates/${code}/${action}`, { method: "POST" });
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
        className="rounded border border-gray-300 dark:border-slate-600 px-2.5 py-1 text-xs disabled:opacity-50"
      >
        {loading ? "…" : label}
      </button>
      {error && <span className="max-w-[10rem] text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
