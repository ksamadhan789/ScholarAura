"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COURSE_CATEGORIES } from "@/lib/courseCategories";

export default function NewExternalCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string>(COURSE_CATEGORIES[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/external-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, provider, description, url, category }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't add the link. Please try again.");
        return;
      }

      router.push("/dashboard/external-courses");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Add a recommended course</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
        Paste a link to a real course from another provider (Google, Coursera,
        edX, LinkedIn Learning, etc). Students will be sent to that provider&apos;s
        site to actually take it — we just feature it here.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Course title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Provider</label>
          <input
            type="text"
            required
            placeholder="e.g. Google, Coursera, edX"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Link to the actual course
          </label>
          <input
            type="url"
            required
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Double-check this is the real, correct URL before publishing.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          >
            {COURSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add link (as draft)"}
        </button>
      </form>
    </main>
  );
}
