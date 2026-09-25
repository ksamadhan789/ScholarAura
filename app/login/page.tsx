"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { GoogleOneTap } from "@/components/GoogleOneTap";
import { VerifyEmailPrompt } from "@/components/auth/VerifyEmailPrompt";
import { Award, BookOpen, Briefcase } from "lucide-react";
import {
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AuthDivider,
  AuthShell,
  GoogleButton,
} from "@/components/auth/AuthShell";
import { safeCallbackPath } from "@/lib/safeRedirect";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/** Where to land after signing in — the page that sent them here, if it's ours. */
function afterSignInPath(): string {
  if (typeof window === "undefined") return "/dashboard";
  return safeCallbackPath(new URLSearchParams(window.location.search).get("callbackUrl"), window.location.origin);
}

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
      window.location.assign(afterSignInPath());
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      headline="Pick up right where you left off"
      benefits={[
        { icon: BookOpen, title: "Your courses & progress", text: "Continue lectures from where you stopped." },
        { icon: Award, title: "Your certificates", text: "Download or share them — anyone can verify them." },
        { icon: Briefcase, title: "Applications & job alerts", text: "Track applications and get new jobs by email." },
      ]}
      title="Sign in"
      subtitle="to your ScholarAura account"
      footer={
        <p>
          New here?{" "}
          <Link href="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Create a free account
          </Link>
        </p>
      }
    >
      {GOOGLE_CLIENT_ID && <GoogleOneTap clientId={GOOGLE_CLIENT_ID} callbackPath={afterSignInPath} />}

      <GoogleButton onClick={() => signIn("google", { callbackUrl: afterSignInPath() })} />
      <AuthDivider />

      {unverifiedEmail && (
        <div className="mb-4">
          <VerifyEmailPrompt email={unverifiedEmail} intro="Please verify your email before signing in." />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="login-email" className={AUTH_LABEL_CLASS}>
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={AUTH_INPUT_CLASS}
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${AUTH_INPUT_CLASS} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button type="submit" disabled={loading} className={AUTH_PRIMARY_BUTTON_CLASS}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
