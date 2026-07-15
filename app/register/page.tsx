"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, ref: ref ?? undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex flex-1 w-full max-w-sm flex-col justify-center px-4">
      <h1 className="mb-2 text-2xl font-semibold">Create your account</h1>
      {ref && (
        <p className="mb-4 rounded bg-green-50 dark:bg-green-900/40 px-3 py-2 text-sm text-green-800 dark:text-green-300">
          🎉 You were invited by a friend
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Full name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="mt-4 rounded border border-gray-300 dark:border-slate-600 px-4 py-2"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-sm text-gray-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
