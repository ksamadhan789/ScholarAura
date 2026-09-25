"use client";

import { Suspense, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Turnstile } from "@/components/Turnstile";
import { GoogleOneTap } from "@/components/GoogleOneTap";
import { VerifyEmailPrompt } from "@/components/auth/VerifyEmailPrompt";
import { Briefcase, CalendarDays, Gift, GraduationCap } from "lucide-react";
import {
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AuthDivider,
  AuthShell,
  GoogleButton,
} from "@/components/auth/AuthShell";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          ref: ref ?? undefined,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Sign-in needs a verified email: show "check your inbox" instead of
      // signing in (which would only bounce back with the same prompt).
      if (data?.needsVerification) {
        setRegisteredEmail(email);
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

      // Full page load, not router.push: the router may hold a cached
      // "redirect to /login" for dashboard URLs prefetched while signed out.
      window.location.assign("/dashboard");
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const field = (id: string, label: ReactNode, input: ReactNode) => (
    <div>
      <label htmlFor={id} className={AUTH_LABEL_CLASS}>
        {label}
      </label>
      {input}
    </div>
  );

  return (
    <AuthShell
      eyebrow="Free to join"
      headline="One account for learning, events and your career"
      benefits={[
        {
          icon: GraduationCap,
          title: "Courses with certificates",
          text: "Learn at your own pace — every certificate can be verified.",
        },
        {
          icon: CalendarDays,
          title: "Conferences, FDPs & competitions",
          text: "Register in a few clicks and get reminders before they start.",
        },
        {
          icon: Briefcase,
          title: "Jobs & internships",
          text: "Apply with your profile and get new jobs by email.",
        },
      ]}
      title="Create your free account"
      subtitle={
        ref ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Gift aria-hidden className="h-3.5 w-3.5" />
            You were invited by a friend
          </span>
        ) : (
          "Takes less than a minute."
        )
      }
      footer={
        <>
          <p>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Sign in
            </Link>
          </p>
          <p>
            Hiring talent?{" "}
            <Link href="/recruiter/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Post a job as a recruiter
            </Link>
          </p>
        </>
      }
    >
      {GOOGLE_CLIENT_ID && <GoogleOneTap clientId={GOOGLE_CLIENT_ID} />}

      {registeredEmail ? (
        <div className="flex flex-col gap-4">
          <VerifyEmailPrompt email={registeredEmail} intro="Your account is created." />
          <Link href="/login" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Go to sign in
          </Link>
        </div>
      ) : (
        <>
          <GoogleButton onClick={() => signIn("google", { callbackUrl: "/dashboard" })} />
          <AuthDivider />
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {field(
              "register-name",
              "Full name",
              <input
                id="register-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={AUTH_INPUT_CLASS}
              />
            )}
            {field(
              "register-email",
              "Email",
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={AUTH_INPUT_CLASS}
              />
            )}
            {field(
              "register-password",
              "Password",
              <>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
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
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">At least 8 characters.</p>
              </>
            )}

            {TURNSTILE_SITE_KEY && <Turnstile siteKey={TURNSTILE_SITE_KEY} onVerify={setTurnstileToken} />}

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || (!!TURNSTILE_SITE_KEY && !turnstileToken)}
              className={AUTH_PRIMARY_BUTTON_CLASS}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
