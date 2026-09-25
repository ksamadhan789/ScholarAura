"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronUp, Clock, ListChecks, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/dashboard/ReasonButton";

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
  hasQuiz,
  resourceCount,
  index,
  prev,
  next,
}: {
  slug: string;
  video: VideoInfo;
  hasQuiz: boolean;
  resourceCount: number;
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

  async function remove(): Promise<string | null> {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${slug}/videos/${video.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        return data?.error ?? "Couldn't delete this lecture.";
      }
      router.refresh();
      return null;
    } catch {
      return "Couldn't reach the server.";
    } finally {
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <form
        onSubmit={saveEdit}
        className="flex flex-col gap-3 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm dark:border-brand-800 dark:bg-slate-800"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
            Bunny Stream video GUID
          </label>
          <input
            type="text"
            required
            value={videoProviderId}
            onChange={(e) => setVideoProviderId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
            Duration (minutes)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            required
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white !max-w-[8rem]"
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
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900 dark:text-white">{video.title}</p>
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden className="h-3.5 w-3.5" />
              {Math.round(video.durationSeconds / 60)} min
            </span>
            {video.isPreview && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                Free preview
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => move("up")}
          disabled={loading || !prev}
          aria-label="Move up"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <ChevronUp aria-hidden className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => move("down")}
          disabled={loading || !next}
          aria-label="Move down"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <ChevronDown aria-hidden className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Pencil aria-hidden className="h-3.5 w-3.5" />
          Edit
        </button>
        <Link
          href={`/dashboard/courses/${slug}/lectures/${video.id}/quiz`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {hasQuiz ? <ListChecks aria-hidden className="h-3.5 w-3.5" /> : <Plus aria-hidden className="h-3.5 w-3.5" />}
          Quiz
        </Link>
        <Link
          href={`/dashboard/courses/${slug}/lectures/${video.id}/resources`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {resourceCount > 0 ? (
            <Paperclip aria-hidden className="h-3.5 w-3.5" />
          ) : (
            <Plus aria-hidden className="h-3.5 w-3.5" />
          )}
          {resourceCount > 0 ? `Resources (${resourceCount})` : "Resources"}
        </Link>
        <ConfirmButton
          label="Delete"
          icon={<Trash2 aria-hidden className="h-3.5 w-3.5" />}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          question={`Delete "${video.title}"? This can't be undone.`}
          confirmLabel="Yes, delete"
          tone="danger"
          disabled={loading}
          onConfirm={remove}
        />
      </div>
    </div>
  );
}
