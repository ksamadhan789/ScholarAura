"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ContactButton({ slug, firstName }: { slug: string; firstName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/freelance/${slug}/contact`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(`/freelance/${slug}`)}`);
          return;
        }
        setError(data.error ?? "Couldn't start a conversation. Please try again.");
        return;
      }
      router.push(`/dashboard/freelance/messages/${data.threadId}`);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-block rounded bg-brand-600 px-4 py-2 text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "…" : `Message ${firstName}`}
      </button>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
