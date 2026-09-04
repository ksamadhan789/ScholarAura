"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type VideoInfo = {
  id: string;
  title: string;
  videoProviderId: string;
  durationSeconds: number;
  orderIndex: number;
  isPreview: boolean;
};

export function LectureRow({
  slug,
  video,
  index,
  prev,
  next,
}: {
  slug: string;
  video: VideoInfo;
  index: number;
  prev: { id: string; orderIndex: number } | null;
  next: { id: string; orderIndex: number } | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [videoProviderId, setVideoProviderId] = useState(video.videoProviderId);
  const [durationMinutes, setDurationMinutes] = useState(String(video.durationSeconds / 60));
  const [isPreview, setIsPreview] = useState(video.isPreview);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function patch(id: string, data: Record<string, unknown>) {
    return fetch(`/api/courses/${slug}/videos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function move(direction: "up" | "down") {
    const sibling = direction === "up" ? prev : next;
    if (!sibling) return;
    setLoading(true);
    try {
      await Promise.all([
        patch(video.id, { orderIndex: sibling.orderIndex }),
        patch(sibling.id, { orderIndex: video.orderIndex }),
      ]);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await patch(video.id, { title, videoProviderId, durationMinutes, isPreview });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save changes.");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${video.title}"? This can't be undone.`)) return;
    setLoading(true);
    try {
      await fetch(`/api/courses/${slug}/videos/${video.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <form
        onSubmit={saveEdit}
        className="flex flex-col gap-3 rounded border border-gray-200 dark:border-slate-700 p-3"
      >
        <div>
          <label className="mb-1 block text-xs font-medium">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Bunny Stream video GUID</label>
          <input
            type="text"
            required
            value={videoProviderId}
            onChange={(e) => setVideoProviderId(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Duration (minutes)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            required
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="w-full max-w-[8rem] rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} />
          Allow free preview
        </label>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-gray-500 hover:underline dark:text-slate-400"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded border border-gray-200 dark:border-slate-700 p-3">
      <div className="min-w-0">
        <p className="truncate font-medium">
          {index + 1}. {video.title}
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {Math.round(video.durationSeconds / 60)} min
          {video.isPreview ? " · Free preview" : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => move("up")}
          disabled={loading || !prev}
          aria-label="Move up"
          className="rounded border border-gray-300 dark:border-slate-600 px-2 py-1 text-xs disabled:opacity-30"
        >
          ▲
        </button>
        <button
          onClick={() => move("down")}
          disabled={loading || !next}
          aria-label="Move down"
          className="rounded border border-gray-300 dark:border-slate-600 px-2 py-1 text-xs disabled:opacity-30"
        >
          ▼
        </button>
        <button
          onClick={() => setEditing(true)}
          disabled={loading}
          className="rounded border border-gray-300 dark:border-slate-600 px-2 py-1 text-xs disabled:opacity-50"
        >
          Edit
        </button>
        <button
          onClick={remove}
          disabled={loading}
          className="rounded border border-gray-300 dark:border-slate-600 px-2 py-1 text-xs text-red-600 disabled:opacity-50 dark:text-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
