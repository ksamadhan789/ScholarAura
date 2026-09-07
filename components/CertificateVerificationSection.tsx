"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CertificateVerificationSection() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim()) {
      router.push(`/verify/${encodeURIComponent(code.trim())}`);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
        Your achievement. Your credential.
      </h2>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        Every eligible ScholarAura certificate can be independently verified.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
      >
        <input
          type="text"
          required
          placeholder="Enter Certificate ID (e.g. CERT-2026-000123)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-label="Certificate ID"
          className="w-full flex-1 rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Verify Certificate
        </button>
      </form>
    </section>
  );
}
