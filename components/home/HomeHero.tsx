import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MAIN_NAV_ITEMS } from "@/lib/navItems";
import { HeroCertificate, type HeroNextEvent } from "@/components/home/HeroCertificate";

export type HeroStats = { courses: number; events: number; competitions: number; jobs: number };

// A live count only appears once it's at least this big — "2 courses" in the
// hero undersold more than it reassured. Never a fabricated number.
const HERO_STAT_MIN = 10;

// Top of the homepage: what ScholarAura is, sign-up/explore buttons, a big
// search, quick links, live counts (once they're worth showing) and, on
// desktop, a sample-certificate illustration with the next real event.
export function HomeHero({
  stats,
  nextEvent,
  isLoggedIn,
}: {
  stats: HeroStats;
  nextEvent: HeroNextEvent;
  isLoggedIn: boolean;
}) {
  const statTiles: { value: number; label: string; href: string }[] = [
    { value: stats.courses, label: stats.courses === 1 ? "course" : "courses", href: "/courses" },
    { value: stats.events, label: stats.events === 1 ? "upcoming event" : "upcoming events", href: "/events" },
    { value: stats.competitions, label: stats.competitions === 1 ? "open competition" : "open competitions", href: "/competitions" },
    { value: stats.jobs, label: stats.jobs === 1 ? "open job" : "open jobs", href: "/jobs" },
  ].filter((t) => t.value >= HERO_STAT_MIN);

  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-brand-50 via-white to-sky-50 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(29,78,216,0.16) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <p className="mb-3 inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            For students, faculty &amp; professionals
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Learn, take part and{" "}
            <span className="bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent">
              get hired
            </span>{" "}
            — all in one place
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Courses with certificates, conferences and workshops, competitions, jobs, internships
            and freelance work on ScholarAura.
          </p>

          {!isLoggedIn && (
            <div className="mt-7 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-600 px-3 py-3 text-sm sm:px-6 sm:text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700"
              >
                Get started free
                <ArrowRight aria-hidden className="hidden h-4 w-4 sm:block" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm sm:px-6 sm:text-base font-semibold text-slate-800 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                Explore courses
              </Link>
            </div>
          )}

          <div className="mt-8 max-w-2xl">
            <SearchBar size="lg" />
          </div>

          {/* Hidden on phones — the header's mobile icon strip already shows these. */}
          <div className="mt-5 hidden flex-wrap gap-2 sm:flex">
            {MAIN_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:text-brand-400"
              >
                <item.icon aria-hidden className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>

          {statTiles.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              {statTiles.map((tile) => (
                <Link key={tile.href} href={tile.href} className="group">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{tile.value.toLocaleString("en-IN")}</p>
                  <p className="text-sm text-slate-500 group-hover:text-brand-600 dark:text-slate-400 dark:group-hover:text-brand-400">
                    {tile.label}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="hidden min-w-0 pb-8 lg:col-span-2 lg:block">
          <HeroCertificate nextEvent={nextEvent} />
        </div>
      </div>
    </section>
  );
}
