"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BundleCourseSelector } from "@/components/BundleCourseSelector";

type CourseOption = { id: string; title: string; price: string };

export function EditBundleForm({
  slug,
  courses,
  initial,
}: {
  slug: string;
  courses: CourseOption[];
  initial: {
    title: string;
    description: string;
    price: string;
    thumbnailUrl: string;
    isPublished: boolean;
    courseIds: string[];
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [price, setPrice] = useState(initial.price);
  const [thumbnailUrl, setThumbnailUrl] = useState(initial.thumbnailUrl);
  const [isPublished, setIsPublished] = useState(initial.isPublished);
  const [courseIds, setCourseIds] = useState<string[]>(initial.courseIds);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (courseIds.length < 2) {
      setError("A bundle needs at least 2 courses.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/bundles/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price,
          thumbnailUrl: thumbnailUrl || undefined,
          isPublished,
          courseIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save changes. Please try again.");
        return;
      }

      router.push("/dashboard/bundles");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bundles/${slug}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Couldn't delete this bundle.");
        return;
      }
      router.push("/dashboard/bundles");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Thumbnail URL (optional)</label>
        <input
          type="url"
          placeholder="https://..."
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Bundle price (₹, use 0 for free)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        Published (visible to students)
      </label>

      <BundleCourseSelector allCourses={courses} selectedIds={courseIds} onChange={setCourseIds} />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={loading}
          className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 disabled:opacity-50 dark:border-red-700 dark:text-red-400"
        >
          Delete bundle
        </button>
      </div>
    </form>
  );
}
