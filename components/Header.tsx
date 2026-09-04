"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";
import { NotificationBell } from "./NotificationBell";
import { EVENT_TYPE_TABS } from "@/lib/eventLabels";

export function Header() {
  const { data: session, status } = useSession();
  const [eventsOpen, setEventsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileEventsOpen, setMobileEventsOpen] = useState(false);
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
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
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

        <nav className="hidden items-center gap-4 text-sm text-slate-600 dark:text-slate-300 md:flex">
          <Link href="/courses" className="hover:text-brand-600 dark:hover:text-brand-400">
            📚 Courses
          </Link>

          <Link href="/competitions" className="hover:text-brand-600 dark:hover:text-brand-400">
            🏆 Competitions
          </Link>

          <Link href="/jobs" className="hover:text-brand-600 dark:hover:text-brand-400">
            💼 Jobs
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
              📅 Events
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
                  ✨ All Events
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

        <div className="hidden min-w-0 flex-1 md:block">
          <SearchBar />
        </div>

        <div className="hidden items-center gap-3 text-sm md:flex">
          <ThemeToggle />
          <NotificationBell />
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

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <NotificationBell />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
            className="rounded border border-slate-300 p-2 text-slate-700 dark:border-slate-600 dark:text-slate-200"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-700 md:hidden">
          <div className="mb-4">
            <SearchBar />
          </div>

          <nav className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            <Link
              href="/courses"
              onClick={() => setMobileOpen(false)}
              className="rounded px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              📚 Courses
            </Link>
            <Link
              href="/competitions"
              onClick={() => setMobileOpen(false)}
              className="rounded px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              🏆 Competitions
            </Link>
            <Link
              href="/jobs"
              onClick={() => setMobileOpen(false)}
              className="rounded px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              💼 Jobs
            </Link>

            <button
              type="button"
              onClick={() => setMobileEventsOpen((v) => !v)}
              aria-expanded={mobileEventsOpen}
              className="flex items-center justify-between rounded px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              📅 Events
              <span aria-hidden className="text-[10px]">{mobileEventsOpen ? "▴" : "▾"}</span>
            </button>
            {mobileEventsOpen && (
              <div className="ml-4 flex flex-col gap-1 border-l border-slate-200 pl-3 dark:border-slate-700">
                <Link
                  href="/events"
                  onClick={() => setMobileOpen(false)}
                  className="rounded px-2 py-1.5 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  ✨ All Events
                </Link>
                {EVENT_TYPE_TABS.map(({ type, label }) => (
                  <Link
                    key={type}
                    href={`/events?type=${type}`}
                    onClick={() => setMobileOpen(false)}
                    className="rounded px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-700">
            {status === "loading" ? null : session ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded px-2 py-2 text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Dashboard ({session.user?.name})
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="rounded border border-slate-300 px-3 py-2 text-left text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded border border-slate-300 px-3 py-2 text-center text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded bg-brand-600 px-3 py-2 text-center text-white transition-colors hover:bg-brand-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
