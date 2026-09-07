"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";
import { NotificationBell } from "./NotificationBell";
import { LocationPicker } from "./LocationPicker";

type MenuItem = { href: string; icon: string; label: string; description: string };
type MenuGroup = { heading: string; items: MenuItem[] };

const EXPLORE_MENU: MenuGroup[] = [
  {
    heading: "Learn",
    items: [
      { href: "/courses", icon: "📚", label: "Courses", description: "Structured, practical skill-building" },
      { href: "/events?type=WEBINAR", icon: "💻", label: "Webinars", description: "Live sessions with experts" },
      { href: "/events?type=FDP", icon: "🎓", label: "Faculty Development Programs", description: "Grow your teaching & research practice" },
      { href: "/events?type=HANDS_ON_TRAINING", icon: "🧪", label: "Hands-on & VR Training", description: "Learn by doing" },
    ],
  },
  {
    heading: "Connect",
    items: [
      { href: "/events?type=INTERNATIONAL_CONFERENCE", icon: "🌍", label: "International Conferences", description: "Meet the global academic community" },
      { href: "/events?type=NATIONAL_CONFERENCE", icon: "🏛️", label: "National Conferences", description: "Connect closer to home" },
    ],
  },
  {
    heading: "Showcase",
    items: [
      { href: "/competitions", icon: "🏆", label: "Competitions", description: "Prove your skills, win recognition" },
    ],
  },
  {
    heading: "Advance",
    items: [
      { href: "/jobs", icon: "💼", label: "Jobs & Internships", description: "Find your next opportunity" },
      { href: "/bundles", icon: "🎁", label: "Bundles", description: "Curated learning paths, one price" },
    ],
  },
];

const OPPORTUNITIES_MENU: MenuItem[] = [
  { href: "/courses", icon: "🎓", label: "For Students", description: "Learn, compete, get certified" },
  { href: "/events?type=FDP", icon: "🧑‍🏫", label: "For Faculty & Researchers", description: "Develop and present your work" },
  { href: "/recruiter/register", icon: "🏛️", label: "For Institutions & Employers", description: "Reach academic talent" },
];

function ExploreMegaMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-5 p-6">
      {EXPLORE_MENU.map((group) => (
        <div key={group.heading}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {group.heading}
          </p>
          <div className="flex flex-col gap-2.5">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <span aria-hidden className="mt-0.5 text-lg">{item.icon}</span>
                <span>
                  <span className="block text-sm font-medium text-slate-900 dark:text-white">
                    {item.label}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {item.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function OpportunitiesMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col gap-1 p-3">
      {OPPORTUNITIES_MENU.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <span aria-hidden className="mt-0.5 text-lg">{item.icon}</span>
          <span>
            <span className="block text-sm font-medium text-slate-900 dark:text-white">
              {item.label}
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              {item.description}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function Header() {
  const { data: session, status } = useSession();
  const [exploreOpen, setExploreOpen] = useState(false);
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExploreOpen, setMobileExploreOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openMenu(setter: (v: boolean) => void) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setter(true);
  }
  function scheduleCloseMenu(setter: (v: boolean) => void) {
    closeTimer.current = setTimeout(() => setter(false), 150);
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"
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

        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 lg:flex">
          <div
            className="relative"
            onMouseEnter={() => openMenu(setExploreOpen)}
            onMouseLeave={() => scheduleCloseMenu(setExploreOpen)}
          >
            <button
              type="button"
              onClick={() => setExploreOpen((v) => !v)}
              className="flex items-center gap-1 rounded px-3 py-2 hover:bg-slate-50 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400"
              aria-expanded={exploreOpen}
            >
              Explore
              <span aria-hidden className="text-[10px]">▾</span>
            </button>
            {exploreOpen && (
              <div
                className="absolute left-0 top-full z-20 mt-1 w-[560px] rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
                onMouseEnter={() => openMenu(setExploreOpen)}
                onMouseLeave={() => scheduleCloseMenu(setExploreOpen)}
              >
                <ExploreMegaMenu onNavigate={() => setExploreOpen(false)} />
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => openMenu(setOpportunitiesOpen)}
            onMouseLeave={() => scheduleCloseMenu(setOpportunitiesOpen)}
          >
            <button
              type="button"
              onClick={() => setOpportunitiesOpen((v) => !v)}
              className="flex items-center gap-1 rounded px-3 py-2 hover:bg-slate-50 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400"
              aria-expanded={opportunitiesOpen}
            >
              Opportunities
              <span aria-hidden className="text-[10px]">▾</span>
            </button>
            {opportunitiesOpen && (
              <div
                className="absolute left-0 top-full z-20 mt-1 w-72 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
                onMouseEnter={() => openMenu(setOpportunitiesOpen)}
                onMouseLeave={() => scheduleCloseMenu(setOpportunitiesOpen)}
              >
                <OpportunitiesMenu onNavigate={() => setOpportunitiesOpen(false)} />
              </div>
            )}
          </div>
        </nav>

        <div className="hidden shrink-0 xl:block">
          <LocationPicker />
        </div>

        <div className="hidden min-w-0 flex-1 md:block">
          <SearchBar />
        </div>

        <div className="hidden items-center gap-3 text-sm md:flex">
          <ThemeToggle />
          <NotificationBell />
          {status === "loading" ? null : session ? (
            <>
              <Link
                href="/dashboard/wishlist"
                aria-label="Saved for later"
                className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
              >
                ❤️
              </Link>
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
                className="text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded bg-brand-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-brand-700"
              >
                Get Started
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

          <div className="mb-4">
            <LocationPicker />
          </div>

          <nav className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setMobileExploreOpen((v) => !v)}
              aria-expanded={mobileExploreOpen}
              className="flex items-center justify-between rounded px-2 py-2 text-left font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Explore
              <span aria-hidden className="text-[10px]">{mobileExploreOpen ? "▴" : "▾"}</span>
            </button>
            {mobileExploreOpen && (
              <div className="ml-2 flex flex-col gap-3 border-l border-slate-200 py-2 pl-3 dark:border-slate-700">
                {EXPLORE_MENU.map((group) => (
                  <div key={group.heading}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {group.heading}
                    </p>
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded px-1 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        {item.icon} {item.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <p className="mt-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Opportunities
            </p>
            {OPPORTUNITIES_MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {item.icon} {item.label}
              </Link>
            ))}

            {session && (
              <>
                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                <Link
                  href="/dashboard/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="rounded px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  ❤️ Saved for later
                </Link>
              </>
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
                  className="rounded bg-brand-600 px-3 py-2 text-center font-medium text-white transition-colors hover:bg-brand-700"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
