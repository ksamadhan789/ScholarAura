"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Turnstile } from "@/components/Turnstile";
import { VerifyEmailPrompt } from "@/components/auth/VerifyEmailPrompt";
import { Sparkles, UserCheck, Users } from "lucide-react";
import {
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AuthShell,
} from "@/components/auth/AuthShell";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function RecruiterRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [designation, setDesignation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/recruiter/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          companyName,
          companyWebsite: companyWebsite || undefined,
          designation: designation || undefined,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

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
      window.location.assign("/dashboard/recruiter");
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="For recruiters"
      headline="Hire from ScholarAura's student and professional community"
      benefits={[
        {
          icon: UserCheck,
          title: "Reviewed and trusted",
          text: "Your account and every job are reviewed before they go live.",
        },
        {
          icon: Users,
          title: "Applicants in one place",
          text: "Resumes, shortlisting and messages in your recruiter dashboard.",
        },
        {
          icon: Sparkles,
          title: "Featured boosts",
          text: "Pin a job to the top of the jobs page when you need more reach.",
        },
      ]}
      title="Create a recruiter account"
      subtitle="We review new recruiter accounts before your first job goes live."
      footer={
        <>
          <p>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Sign in
            </Link>
          </p>
          <p>
            Looking for a job instead?{" "}
            <Link href="/jobs" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Browse jobs
            </Link>
          </p>
        </>
      }
    >
      {registeredEmail ? (
        <div className="flex flex-col gap-4">
          <VerifyEmailPrompt
            email={registeredEmail}
            intro="Almost done — once your email is verified, our team reviews new recruiter accounts."
            variant="signup"
          />
          <Link href="/login" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Go to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="rec-name" className={AUTH_LABEL_CLASS}>
                Your name
              </label>
              <input
                id="rec-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={AUTH_INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="rec-email" className={AUTH_LABEL_CLASS}>
                Work email
              </label>
              <input
                id="rec-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={AUTH_INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="rec-password" className={AUTH_LABEL_CLASS}>
                Password
              </label>
              <div className="relative">
                <input
                  id="rec-password"
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
            </div>
            <div>
              <label htmlFor="rec-company" className={AUTH_LABEL_CLASS}>
                Company name
              </label>
              <input
                id="rec-company"
                type="text"
                required
                autoComplete="organization"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={AUTH_INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="rec-website" className={AUTH_LABEL_CLASS}>
                Company website{" "}
                <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
              </label>
              <input
                id="rec-website"
                type="url"
                placeholder="https://..."
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                className={AUTH_INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="rec-designation" className={AUTH_LABEL_CLASS}>
                Your designation{" "}
                <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
              </label>
              <input
                id="rec-designation"
                type="text"
                placeholder="e.g. Talent Acquisition Manager"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className={AUTH_INPUT_CLASS}
              />
            </div>

          {TURNSTILE_SITE_KEY && <Turnstile siteKey={TURNSTILE_SITE_KEY} onVerify={setTurnstileToken} />}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || (!!TURNSTILE_SITE_KEY && !turnstileToken)}
            className={AUTH_PRIMARY_BUTTON_CLASS}
          >
            {loading ? "Creating account…" : "Create recruiter account"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
