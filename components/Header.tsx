"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { EVENT_TYPE_TABS } from "@/lib/eventLabels";

export function Header() {
  const { data: session, status } = useSession();
  const [eventsOpen, setEventsOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openEventsMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setEventsOpen(true);
  }
  function scheduleCloseEventsMenu() {
    closeTimer.current = setTimeout(() => setEventsOpen(false), 150);
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon-mark.png"
            alt=""
            aria-hidden="true"
            className="h-8 w-8 dark:invert"
          />
          ScholarAura
        </Link>

        <nav className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
          <Link href="/courses" className="hover:text-brand-600 dark:hover:text-brand-400">
            Courses
          </Link>

          <div
            className="relative"
            onMouseEnter={openEventsMenu}
            onMouseLeave={scheduleCloseEventsMenu}
          >
            <button
              type="button"
              onClick={() => setEventsOpen((v) => !v)}
              className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400"
              aria-expanded={eventsOpen}
            >
              Events
              <span aria-hidden className="text-[10px]">▾</span>
            </button>

            {eventsOpen && (
              <div
                className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800"
                onMouseEnter={openEventsMenu}
                onMouseLeave={scheduleCloseEventsMenu}
              >
                <Link
                  href="/events"
                  onClick={() => setEventsOpen(false)}
                  className="block px-4 py-2 font-medium hover:bg-brand-50 dark:hover:bg-slate-700"
                >
                  All Events
                </Link>
                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                {EVENT_TYPE_TABS.map(({ type, label }) => (
                  <Link
                    key={type}
                    href={`/events?type=${type}`}
                    onClick={() => setEventsOpen(false)}
                    className="block px-4 py-2 hover:bg-brand-50 dark:hover:bg-slate-700"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-3 text-sm">
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
