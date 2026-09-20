"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

/** The escape hatch when Aura can't answer — raises a real support ticket a human replies to by email. Shown by both the floating widget and the full /aura page. */
export function SupportTicketForm({ query }: { query: string }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (submitted) {
    return (
      <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
        ✅ Got it — we&rsquo;ll email you back{session ? "" : email ? ` at ${email}` : ""}.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-fit items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        🎫 Still stuck? Raise a support ticket
      </button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, message, ...(session ? {} : { name, email }) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
    >
      {!session && (
        <>
          <input
            type="text"
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <input
            type="email"
            required
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </>
      )}
      <textarea
        required
        rows={2}
        placeholder="What do you need help with?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="resize-none rounded border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send to support"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-500 hover:underline dark:text-slate-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
