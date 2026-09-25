"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";

// "Check your inbox" box shown after sign-up, and on the login page when an
// unverified account tries to sign in (a fresh link has already been sent).
//
// The "signup" variant's wording has to be true for both outcomes of a
// sign-up — a new account (verification link sent) and an email that already
// had an account (a "you already have an account" email sent) — because the
// page deliberately can't tell them apart (lib/signupExistingAccount.ts).
export function VerifyEmailPrompt({
  email,
  intro,
  variant = "verify",
}: {
  email: string;
  intro: string;
  variant?: "verify" | "signup";
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function resend() {
    setState("sending");
    try {
      await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setState("sent");
    }
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm dark:border-slate-600 dark:bg-slate-800">
      <p className="flex items-center gap-2 font-semibold text-brand-800 dark:text-brand-300">
        <MailCheck aria-hidden className="h-4 w-4" />
        Check your inbox
      </p>
      <p className="mt-1 text-slate-700 dark:text-slate-300">
        {variant === "signup" ? (
          <>
            {intro} We&apos;ve sent an email to <strong className="break-all">{email}</strong> with the next step — a
            link to verify your address, or, if that email already has a ScholarAura account, how to sign in. Can&apos;t
            find it? Check your spam folder.
          </>
        ) : (
          <>
            {intro} We sent a verification link to <strong className="break-all">{email}</strong>. Click it, then sign
            in. Can&apos;t find it? Check your spam folder.
          </>
        )}
      </p>
      <button
        type="button"
        onClick={resend}
        disabled={state !== "idle"}
        className="mt-3 text-sm font-semibold text-brand-600 underline disabled:no-underline disabled:opacity-60 dark:text-brand-400"
      >
        {state === "sending" ? "Sending…" : state === "sent" ? "Sent — check your inbox" : "Resend the link"}
      </button>
    </div>
  );
}
