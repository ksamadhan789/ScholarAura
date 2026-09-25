"use client";

import { useState, type ReactNode } from "react";

/**
 * A button that opens a small inline text box instead of a browser prompt —
 * used for admin decisions that need a note (rejection reason, support reply).
 * `onSubmit` returns an error message to show, or null on success.
 */
export function ReasonButton({
  label,
  icon,
  className,
  title,
  placeholder,
  submitLabel,
  optional = false,
  disabled = false,
  onSubmit,
}: {
  label: string;
  icon?: ReactNode;
  className: string;
  /** Shown above the text box, e.g. "Reason (shown to the recruiter)". */
  title: string;
  placeholder?: string;
  submitLabel: string;
  optional?: boolean;
  disabled?: boolean;
  onSubmit: (text: string) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} disabled={disabled} className={className}>
        {icon}
        {label}
      </button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!optional && !text.trim()) {
      setError("Please write something first.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await onSubmit(text.trim());
    setBusy(false);
    if (result) {
      setError(result);
    } else {
      setOpen(false);
      setText("");
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:w-80 dark:border-slate-700 dark:bg-slate-900/40"
    >
      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
        {title}
        {optional && <span className="font-normal text-slate-400"> (optional)</span>}
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </label>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={busy}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

/**
 * A button that asks "are you sure?" inline before running `onConfirm` —
 * the in-page replacement for window.confirm on irreversible admin actions.
 */
export function ConfirmButton({
  label,
  icon,
  className,
  question,
  confirmLabel,
  tone = "approve",
  disabled = false,
  onConfirm,
}: {
  label: string;
  icon?: ReactNode;
  className: string;
  question: string;
  confirmLabel: string;
  /** Colour of the final "yes" button — green to approve, red for destructive actions. */
  tone?: "approve" | "danger";
  disabled?: boolean;
  onConfirm: () => Promise<string | null>;
}) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} disabled={disabled} className={className}>
        {icon}
        {label}
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 sm:w-80 dark:border-amber-800 dark:bg-amber-900/20">
      <p className="text-xs font-medium text-amber-900 dark:text-amber-200">{question}</p>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setAsking(false);
            setError(null);
          }}
          disabled={busy}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            const result = await onConfirm();
            setBusy(false);
            if (result) setError(result);
            else setAsking(false);
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
            tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </div>
  );
}
