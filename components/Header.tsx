"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { TranslateWidget } from "./TranslateWidget";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"
        >
          <span aria-hidden>🎓</span>
          ScholarAura
        </Link>

        <nav className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
          <Link href="/courses" className="hover:text-brand-600 dark:hover:text-brand-400">
            Courses
          </Link>
          <Link href="/events" className="hover:text-brand-600 dark:hover:text-brand-400">
            Events
          </Link>
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <TranslateWidget />
          <ThemeToggle />
          {status === "loading" ? null : session ? (
            <>
              <Link
                href="/dashboard"
                className="text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
              >
                Dashboard
              </Link>
              <span className="hidden text-slate-400 sm:inline dark:text-slate-500">
                {session.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded bg-brand-600 px-3 py-1.5 text-white transition-colors hover:bg-brand-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
