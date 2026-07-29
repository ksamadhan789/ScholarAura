"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubmissionForm({
  slug,
  initialUrl,
  initialNotes,
  deadlinePassed,
}: {
  slug: string;
  initialUrl: string;
  initialNotes: string;
  deadlinePassed: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/competitions/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionUrl: url, submissionNotes: notes || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save your submission. Please try again.");
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (deadlinePassed && !initialUrl) {
    return (
      <p className="text-sm text-gray-500 dark:text-slate-400">
        The submission deadline has passed and no entry was submitted.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded border border-gray-200 dark:border-slate-700 p-4"
    >
      <h2 className="font-medium">{initialUrl ? "Your submission" : "Submit your entry"}</h2>
      <div>
        <label className="mb-1 block text-sm font-medium">Link to your work</label>
        <input
          type="url"
          required
          disabled={deadlinePassed}
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white disabled:opacity-50"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
        <textarea
          rows={3}
          disabled={deadlinePassed}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white disabled:opacity-50"
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}
      {!deadlinePassed && (
        <button
          type="submit"
          disabled={loading}
          className="self-start rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Saving…" : initialUrl ? "Update submission" : "Submit entry"}
        </button>
      )}
    </form>
  );
}
