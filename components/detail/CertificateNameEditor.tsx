"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Check, Lock, Pencil } from "lucide-react";
import { CERTIFICATE_NAME_MAX } from "@/lib/certificateName";

/**
 * Shows the name that will be printed on an event/competition certificate,
 * with an inline Edit. `endpoint` is the certificate-name route; `userId`
 * is passed only when an admin edits someone else's name. `locked` shows
 * the name read-only (the certificate has already been issued).
 */
export function CertificateNameEditor({
  endpoint,
  name,
  userId,
  locked = false,
  compact = false,
}: {
  endpoint: string;
  name: string;
  userId?: string;
  locked?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value, userId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't save the name. Please try again.");
        return;
      }
      setValue(data.certificateName);
      setEditing(false);
      setSaved(true);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className={compact ? "min-w-[14rem]" : ""}>
        {!compact && (
          <label
            htmlFor="certificate-name"
            className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            Name on certificate
          </label>
        )}
        <input
          id={compact ? undefined : "certificate-name"}
          aria-label="Name on certificate"
          type="text"
          value={value}
          maxLength={CERTIFICATE_NAME_MAX}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          autoFocus
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving || !value.trim()}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setValue(name);
              setError(null);
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-slate-900 dark:text-white">{value}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Edit certificate name for ${value}`}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-700"
        >
          <Pencil aria-hidden className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-slate-700">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Award aria-hidden className="h-3.5 w-3.5" />
        Name on certificate
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="font-medium text-slate-900 dark:text-white">{value}</span>
        {locked ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Lock aria-hidden className="h-3.5 w-3.5" />
            Issued
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setSaved(false);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            <Pencil aria-hidden className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>
      {saved && (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
          <Check aria-hidden className="h-3.5 w-3.5" />
          Saved
        </p>
      )}
      {locked && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Your certificate is issued. Contact support if the name needs correcting.
        </p>
      )}
    </div>
  );
}
