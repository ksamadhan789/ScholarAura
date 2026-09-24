"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";
import { NotificationBell } from "./NotificationBell";
import { LocationPicker } from "./LocationPicker";
import { Avatar } from "./Avatar";
import { ChevronDown, Menu, X } from "lucide-react";
import { EVENT_TYPE_TABS } from "@/lib/eventLabels";
import { MAIN_NAV_ITEMS } from "@/lib/navItems";

// Every category except Events, which the desktop bar renders as a
// dropdown of event types instead of a plain link.
const DESKTOP_LINK_ITEMS = MAIN_NAV_ITEMS.filter((item) => item.href !== "/events");
const EventsIcon = MAIN_NAV_ITEMS.find((item) => item.href === "/events")!.icon;

export function Header() {
  const { data: session, status } = useSession();
  const [eventsOpen, setEventsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openEventsMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setEventsOpen(true);
  }
  function scheduleCloseEventsMenu() {
    closeTimer.current = setTimeout(() => setEventsOpen(false), 150);
  }

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3">
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

        <div className="hidden min-w-0 flex-1 md:block">
          <SearchBar />
        </div>

        <div className="hidden items-center gap-3 text-sm md:flex">
          <LocationPicker />
          <ThemeToggle />
          <NotificationBell />
          {status === "loading" ? null : session ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 leading-tight text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
              >
                <Avatar name={session.user?.name ?? firstName} src="/api/account/photo" size={32} />
                <span className="flex flex-col">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Hello, {firstName}
                  </span>
                  <span className="font-semibold">Dashboard</span>
                </span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex flex-col leading-tight text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
              >
                <span className="text-xs text-slate-400 dark:text-slate-500">Hello, sign in</span>
                <span className="font-semibold">Log in</span>
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {status !== "loading" && !session && (
            <Link
              href="/login"
              className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
            >
              Sign up/in
            </Link>
          )}
          <ThemeToggle />
          <NotificationBell />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
            className="rounded-lg border border-slate-300 p-2 text-slate-700 dark:border-slate-600 dark:text-slate-200"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile category strip — same categories as the desktop nav below,
          but always visible (not tucked inside the hamburger menu) and laid
          out icon-over-label, shopping-app style: a row of narrow columns
          that scrolls by touch, no auto-scroll. Scrollbar hidden via
          .no-scrollbar in globals.css. */}
      <div className="overflow-x-auto border-b border-slate-200 bg-white no-scrollbar md:hidden dark:border-slate-700 dark:bg-slate-900">
        <div className="flex w-max gap-1 px-3 py-3">
          {MAIN_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex w-[4.25rem] shrink-0 flex-col items-center gap-1.5 rounded-lg px-1 py-1 text-center text-slate-600 dark:text-slate-300"
            >
              <span
                aria-hidden
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 dark:bg-slate-800 dark:text-brand-400"
              >
                <item.icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="text-[11px] font-medium leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Category strip — deliberately always dark, independent of the site
          theme, matching the reference marketplace header's static navy bar. */}
      <nav className="hidden bg-navy-900 md:block">
        <div className="mx-auto flex max-w-[1600px] items-center gap-1 px-2 py-1.5 text-sm font-medium text-slate-200">
          {DESKTOP_LINK_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors hover:bg-white/10 hover:text-white"
            >
              <item.icon aria-hidden className="h-4 w-4 opacity-80" />
              {item.label}
            </Link>
          ))}

          <div
            className="relative"
            onMouseEnter={openEventsMenu}
            onMouseLeave={scheduleCloseEventsMenu}
          >
            <button
              type="button"
              onClick={() => setEventsOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors hover:bg-white/10 hover:text-white"
              aria-expanded={eventsOpen}
            >
              <EventsIcon aria-hidden className="h-4 w-4 opacity-80" />
              Events
              <ChevronDown aria-hidden className="h-3.5 w-3.5 opacity-70" />
            </button>

            {eventsOpen && (
              <div
                className="absolute left-0 top-full z-20 mt-1 w-64 rounded-xl border border-slate-200 bg-white py-2 text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-700 md:hidden">
          <div className="mb-4">
            <SearchBar />
          </div>

          <div className="mb-4">
            <LocationPicker />
          </div>

          <div className="flex flex-col gap-2 text-sm">
            {status === "loading" ? null : session ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded px-2 py-2 text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <span className="block text-xs text-slate-400 dark:text-slate-500">
                    Hello, {firstName}
                  </span>
                  Dashboard
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
                <span className="px-2 text-xs text-slate-400 dark:text-slate-500">
                  Hello, sign in
                </span>
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
