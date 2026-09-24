import Link from "next/link";
import { BookOpen, Briefcase, CalendarDays, Trophy, type LucideIcon } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MAIN_NAV_ITEMS } from "@/lib/navItems";

export type HeroStats = { courses: number; events: number; competitions: number; jobs: number };

// Top of the homepage: what ScholarAura is, a big search, quick links, and
// live counts from the database. A count of zero is left out rather than
// shown as "0", and the whole stats panel hides if everything is zero —
// never a fabricated number.
export function HomeHero({ stats }: { stats: HeroStats }) {
  const statTiles: { icon: LucideIcon; value: number; label: string; href: string }[] = [
    { icon: BookOpen, value: stats.courses, label: stats.courses === 1 ? "course" : "courses", href: "/courses" },
    { icon: CalendarDays, value: stats.events, label: stats.events === 1 ? "upcoming event" : "upcoming events", href: "/events" },
    { icon: Trophy, value: stats.competitions, label: stats.competitions === 1 ? "open competition" : "open competitions", href: "/competitions" },
    { icon: Briefcase, value: stats.jobs, label: stats.jobs === 1 ? "open job" : "open jobs", href: "/jobs" },
  ].filter((t) => t.value > 0);

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
        </div>

        {statTiles.length > 0 && (
          <div className="grid min-w-0 grid-cols-2 gap-3 lg:col-span-2">
            {statTiles.map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-slate-700 dark:text-brand-400">
                  <tile.icon aria-hidden className="h-5 w-5" />
                </span>
                <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
                  {tile.value.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-slate-500 group-hover:text-brand-600 dark:text-slate-400 dark:group-hover:text-brand-400">
                  {tile.label}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
