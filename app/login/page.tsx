"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { GoogleOneTap } from "@/components/GoogleOneTap";
import { VerifyEmailPrompt } from "@/components/auth/VerifyEmailPrompt";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      // Right password, unverified email — a fresh link was just emailed.
      if (result?.error === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(email);
        return;
      }
      if (result?.error) {
        setError("Incorrect email or password");
        return;
      }

      // Full page load, not router.push: the router may hold a cached
      // "redirect to /login" for dashboard URLs prefetched while signed out.
      window.location.assign("/dashboard");
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative flex flex-1 flex-col justify-center overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0), linear-gradient(to bottom right, #1d4ed8, #1e40af, #0f172a)",
        backgroundSize: "28px 28px, 100% 100%",
      }}
    >
      {GOOGLE_CLIENT_ID && <GoogleOneTap clientId={GOOGLE_CLIENT_ID} />}

      <div className="mx-auto grid w-full max-w-[1600px] gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="text-center lg:text-left">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-100">
            🌟 For professionals, academics & students worldwide
          </span>
          <h1 className="mt-5 text-4xl font-bold text-white sm:text-5xl">ScholarAura</h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-brand-100 lg:mx-0">
            Courses, international & national conferences, faculty
            development programs, and hands-on trainings — all in one
            place.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <h2 className="text-center text-lg font-semibold text-slate-900 dark:text-white">
              Sign in to ScholarAura
            </h2>

            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-slate-300 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.5 26.9 35.5 24 35.5c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C41.5 36.6 44 30.9 44 24c0-1.3-.1-2.6-.4-3.5z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-600" />
              Or continue with email
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-600" />
            </div>

            {unverifiedEmail && (
              <div className="mb-3">
                <VerifyEmailPrompt email={unverifiedEmail} intro="Please verify your email before signing in." />
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded border border-slate-300 px-3 py-2 pr-14 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 rounded bg-brand-600 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
              New here?{" "}
              <Link href="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                Create a free account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
