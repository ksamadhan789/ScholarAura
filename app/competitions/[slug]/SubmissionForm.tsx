"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { MAX_UPLOAD_BYTES } from "@/lib/uploadValidation";

// Shown right above the entry form so a student who hasn't uploaded their
// ID card yet can do it in the same place they submit their entry, instead
// of being sent away to their profile page first. Saves to the profile
// (POST /api/account/id-card), same as EditProfileForm's own ID card
// section — it's reused for every future competition, not tied to this one.
// `fileName`/`onUploaded` are lifted to the parent form so it can enforce
// the ID card as a required field before letting a submission go through.
function IdCardSection({
  fileName,
  onUploaded,
  deadlinePassed,
}: {
  fileName: string | null;
  onUploaded: (fileName: string) => void;
  deadlinePassed: boolean;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(
        `That file is ${(file.size / (1024 * 1024)).toFixed(1)}MB — your ID card must be under ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`
      );
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const blob = await upload(file.name, file, {
        access: "private",
        handleUploadUrl: "/api/account/id-card/blob-upload",
        contentType: file.type,
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      });

      const res = await fetch("/api/account/id-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl: blob.url, fileName: file.name, mimeType: file.type }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't upload your ID card. Please try again.");
        return;
      }
      const data = await res.json();
      onUploaded(data.idCardFileName);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-gray-200 dark:border-slate-700 p-4">
      <h2 className="font-medium">
        Student ID card <span className="font-normal text-red-500">*</span>
      </h2>
      {fileName ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-slate-700 dark:text-slate-300">🪪 {fileName}</p>
          <a
            href="/api/account/id-card"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-gray-300 px-3 py-1.5 text-xs dark:border-slate-600"
          >
            View
          </a>
          {!deadlinePassed && (
            <label className="cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-xs dark:border-slate-600">
              {uploading ? `Uploading… ${progress}%` : "Replace"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileSelected}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>
      ) : deadlinePassed ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">No ID card was uploaded before the deadline.</p>
      ) : (
        <div>
          <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
            Required for eligibility verification — uploaded once here, reused automatically for
            every competition you enter.
          </p>
          <label className="inline-block w-fit cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-slate-600">
            {uploading
              ? `Uploading… ${progress}%`
              : `Upload ID card (image or PDF, max ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB)`}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileSelected}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export function SubmissionForm({
  slug,
  initialUrl,
  initialNotes,
  initialFileName,
  initialIdCardFileName,
  deadlinePassed,
}: {
  slug: string;
  initialUrl: string;
  initialNotes: string;
  initialFileName: string | null;
  initialIdCardFileName: string | null;
  deadlinePassed: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [notes, setNotes] = useState(initialNotes);
  const [fileName, setFileName] = useState(initialFileName);
  const [idCardFileName, setIdCardFileName] = useState(initialIdCardFileName);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    // Checked here, before even attempting the upload, so a bad pick fails
    // instantly with a clear reason instead of after a slow upload attempt.
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(
        `That file is ${(file.size / (1024 * 1024)).toFixed(1)}MB — entry files must be under ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`
      );
      return;
    }
    setError(null);
    setPendingFile(file);
  }

  function handleCancelPendingFile() {
    setPendingFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    // Checked here, before any upload starts, so a missing required field
    // fails instantly instead of after a slow file upload.
    if (!idCardFileName) {
      setError("Upload your student ID card before submitting your entry.");
      return;
    }
    if (!fileName && !pendingFile) {
      setError("Attach your entry file to submit your entry.");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      let blobUrl: string | null = null;
      if (pendingFile) {
        const blob = await upload(pendingFile.name, pendingFile, {
          access: "private",
          handleUploadUrl: `/api/competitions/${slug}/submit/blob-upload`,
          contentType: pendingFile.type,
          onUploadProgress: ({ percentage }) => setUploadProgress(percentage),
        });
        blobUrl = blob.url;
      }

      const res = await fetch(`/api/competitions/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionUrl: url,
          submissionNotes: notes,
          blobUrl,
          fileName: pendingFile?.name,
          mimeType: pendingFile?.type,
          removeFile: !fileName && !pendingFile,
        }),
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
    <div className="flex flex-col gap-4">
      <IdCardSection
        fileName={idCardFileName}
        onUploaded={setIdCardFileName}
        deadlinePassed={deadlinePassed}
      />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded border border-gray-200 dark:border-slate-700 p-4"
      >
        <h2 className="font-medium">
          {initialUrl || initialFileName ? "Your submission" : "Submit your entry"}
        </h2>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Attach your entry file <span className="font-normal text-red-500">*</span>
          </label>
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
                {fileName || pendingFile ? "Replace" : `Choose file (image, PDF, Word or ZIP, max ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB)`}
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
              {pendingFile && (
                <button
                  type="button"
                  onClick={handleCancelPendingFile}
                  className="rounded border border-red-300 px-3 py-1.5 text-xs text-red-600 dark:border-red-800 dark:text-red-400"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Competition entry link{" "}
            <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
          </label>
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
        {saved && (
          <p className="rounded bg-green-100 dark:bg-green-900/40 px-4 py-2.5 text-sm text-green-800 dark:text-green-300">
            🎉 Your entry has been submitted! A confirmation email is on its way.
          </p>
        )}
        {!deadlinePassed && (
          <button
            type="submit"
            disabled={loading}
            className="self-start rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading
              ? pendingFile
                ? `Uploading… ${uploadProgress}%`
                : "Saving…"
              : initialUrl || initialFileName
                ? "Update submission"
                : "Submit entry"}
          </button>
        )}
      </form>
    </div>
  );
}
