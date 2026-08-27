"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ApplyToJobPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [resume, setResume] = useState<File | null>(null);
  const [coverNote, setCoverNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!resume) {
      setError("Please attach your resume as a PDF.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", resume);
      if (coverNote.trim()) formData.append("coverNote", coverNote.trim());

      const res = await fetch(`/api/jobs/${params.slug}/apply`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't submit your application. Please try again.");
        return;
      }

      router.push(`/jobs/${params.slug}`);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Apply for this job</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Resume (PDF, max 4MB)</label>
          <input
            type="file"
            accept="application/pdf"
            required
            onChange={(e) => setResume(e.target.files?.[0] ?? null)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Cover note{" "}
            <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
          </label>
          <textarea
            rows={5}
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            placeholder="A few lines about why you're a good fit..."
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2.5 text-white disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </main>
  );
}
