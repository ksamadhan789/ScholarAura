import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailToken } from "@/lib/emailVerification";
import { ResendVerificationForm } from "./ResendVerificationForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Verify your email", robots: { index: false } };

// Opened from the verification email. Verifying on page load is standard for
// this kind of link: the token is single-use and only proves the inbox
// received it — nothing else can be done with it.
export default async function VerifyEmailPage({ params }: { params: { token: string } }) {
  const email = await verifyEmailToken(params.token);

  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col justify-center px-4 py-20 text-center">
      {email ? (
        <>
          <CheckCircle2 aria-hidden className="mx-auto h-12 w-12 text-green-600" />
          <h1 className="mt-4 text-2xl font-semibold">Email verified</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Thanks — <strong className="break-all">{email}</strong> is confirmed. You can sign in now.
          </p>
          <Link
            href="/login"
            className="mx-auto mt-6 rounded-lg bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700"
          >
            Sign in
          </Link>
        </>
      ) : (
        <>
          <XCircle aria-hidden className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-semibold">This link has expired or was already used</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            If you&apos;ve already verified, just{" "}
            <Link href="/login" className="text-brand-600 underline dark:text-brand-400">
              sign in
            </Link>
            . Otherwise, enter your email and we&apos;ll send a new link.
          </p>
          <ResendVerificationForm />
        </>
      )}
    </main>
  );
}
