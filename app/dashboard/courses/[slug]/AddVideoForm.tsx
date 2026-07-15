"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddVideoForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [videoProviderId, setVideoProviderId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/courses/${slug}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          videoProviderId,
          durationMinutes,
          isPreview,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't add the video. Please try again.");
        return;
      }

      setTitle("");
      setVideoProviderId("");
      setDurationMinutes("");
      setIsPreview(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-gray-200 dark:border-slate-700 p-4">
      <h2 className="font-medium">Add a lecture</h2>
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          Bunny Stream video GUID
        </label>
        <input
          type="text"
          required
          placeholder="e.g. 3a1f2e4c-..."
          value={videoProviderId}
          onChange={(e) => setVideoProviderId(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          Upload the video in your Bunny Stream dashboard first, then paste its Video GUID here.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Duration (minutes)</label>
        <input
          type="number"
          min="0"
          step="0.1"
          required
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPreview}
          onChange={(e) => setIsPreview(e.target.checked)}
        />
        Allow free preview (visible without enrolling)
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Adding…" : "Add lecture"}
      </button>
    </form>
  );
}
