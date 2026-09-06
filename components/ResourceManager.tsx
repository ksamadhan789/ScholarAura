"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ResourceInfo = {
  id: string;
  title: string;
  fileName: string;
  fileSizeBytes: number;
};

export function ResourceManager({
  slug,
  videoId,
  resources,
}: {
  slug: string;
  videoId?: string;
  resources: ResourceInfo[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Please choose a file.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("file", file);
      if (videoId) formData.append("videoId", videoId);

      const res = await fetch(`/api/courses/${slug}/resources`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't upload this file.");
        return;
      }

      setTitle("");
      setFile(null);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string, resourceTitle: string) {
    if (!window.confirm(`Delete "${resourceTitle}"? This can't be undone.`)) return;
    setLoading(true);
    try {
      await fetch(`/api/courses/${slug}/resources/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {resources.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">No resources uploaded yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {resources.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded border border-gray-200 dark:border-slate-700 p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{r.title}</p>
                <p className="truncate text-sm text-gray-500 dark:text-slate-400">
                  {r.fileName} · {Math.max(1, Math.round(r.fileSizeBytes / 1024))} KB
                </p>
              </div>
              <button
                onClick={() => remove(r.id, r.title)}
                disabled={loading}
                className="shrink-0 rounded border border-gray-300 dark:border-slate-600 px-2 py-1 text-xs text-red-600 disabled:opacity-50 dark:text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleUpload}
        className="flex flex-col gap-3 rounded border border-gray-200 dark:border-slate-700 p-4"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lecture slides"
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">File (max 4MB)</label>
          <input
            type="file"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="self-start rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Upload"}
        </button>
      </form>
    </div>
  );
}
