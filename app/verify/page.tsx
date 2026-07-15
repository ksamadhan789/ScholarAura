"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyLookupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim()) {
      router.push(`/verify/${encodeURIComponent(code.trim())}`);
    }
  }

  return (
    <main className="mx-auto flex flex-1 w-full max-w-sm flex-col justify-center px-4">
      <h1 className="mb-2 text-2xl font-semibold">Verify a certificate</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-slate-400">
        Enter the certificate number printed on the certificate (e.g. CERT-2026-000123).
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          required
          placeholder="CERT-2026-000123"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
        <button type="submit" className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-white">
          Verify
        </button>
      </form>
    </main>
  );
}
