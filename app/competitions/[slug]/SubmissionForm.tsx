"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubmissionForm({
  slug,
  initialUrl,
  initialNotes,
  initialFileName,
  deadlinePassed,
}: {
  slug: string;
  initialUrl: string;
  initialNotes: string;
  initialFileName: string | null;
  deadlinePassed: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [notes, setNotes] = useState(initialNotes);
  const [fileName, setFileName] = useState(initialFileName);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingFile(file);
  }

  function handleRemoveAttachedFile() {
    setFileName(null);
    setPendingFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("submissionUrl", url);
      formData.append("submissionNotes", notes);
      if (pendingFile) formData.append("entryFile", pendingFile);
      if (!fileName && !pendingFile) formData.append("removeFile", "true");

      const res = await fetch(`/api/competitions/${slug}/submit`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save your submission. Please try again.");
        return;
      }

      const data = await res.json();
      setFileName(data.submissionFileName ?? null);
      setPendingFile(null);
      setSaved(true);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (deadlinePassed && !initialUrl && !initialFileName) {
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
      <h2 className="font-medium">{initialUrl || initialFileName ? "Your submission" : "Submit your entry"}</h2>

      <div>
        <label className="mb-1 block text-sm font-medium">Attach your entry file</label>
        {(fileName || pendingFile) && (
          <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">
            📎 {pendingFile ? pendingFile.name : fileName}
            {pendingFile && (
              <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">(not saved yet)</span>
            )}
          </p>
        )}
        {!deadlinePassed && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-xs dark:border-slate-600">
              {fileName || pendingFile ? "Replace" : "Choose file (image, PDF, Word or ZIP, max 4MB)"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.zip"
                onChange={handleFileSelected}
                className="hidden"
              />
            </label>
            {fileName && !pendingFile && (
              <a
                href={`/api/competitions/${slug}/submission-file`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-gray-300 px-3 py-1.5 text-xs dark:border-slate-600"
              >
                View
              </a>
            )}
            {(fileName || pendingFile) && (
              <button
                type="button"
                onClick={handleRemoveAttachedFile}
                className="rounded border border-red-300 px-3 py-1.5 text-xs text-red-600 dark:border-red-800 dark:text-red-400"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Or paste a link to your work</label>
        <input
          type="url"
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
          {loading ? "Saving…" : initialUrl || initialFileName ? "Update submission" : "Submit entry"}
        </button>
      )}
    </form>
  );
}
