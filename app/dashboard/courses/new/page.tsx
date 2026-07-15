"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, price, category }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't create the course. Please try again.");
        return;
      }

      router.push("/dashboard/courses");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Create a course</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <input
            type="text"
            required
            placeholder="e.g. Data Science"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Price (₹, use 0 for free)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create course (as draft)"}
        </button>
      </form>
    </main>
  );
}
