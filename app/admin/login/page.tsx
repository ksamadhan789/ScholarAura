"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, getSession } from "next-auth/react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Incorrect email or password");
        return;
      }

      const session = await getSession();
      if (session?.user.role !== "ADMIN") {
        await signOut({ redirect: false });
        setError("This login is for administrators only.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex flex-1 w-full max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 text-2xl font-semibold">Admin login</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
        For platform administrators only.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-slate-800 px-4 py-2 text-white transition-colors hover:bg-slate-900 disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700"
        >
          {loading ? "Logging in…" : "Log in as admin"}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-600 dark:text-slate-400">
        Not an admin?{" "}
        <Link href="/login" className="underline">
          Go to the regular login
        </Link>
      </p>
    </main>
  );
}
