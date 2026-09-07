import Link from "next/link";

const TRUST_POINTS = [
  "Learn from experts",
  "Earn certificates",
  "Discover opportunities",
  "Connect with the academic community",
];

const ECOSYSTEM_CARDS = [
  { icon: "🌍", label: "International Conferences" },
  { icon: "📚", label: "Courses" },
  { icon: "🎓", label: "Faculty Development" },
  { icon: "🏆", label: "Competitions" },
  { icon: "💼", label: "Jobs" },
];

export function HomeHero() {
  return (
    <section className="bg-white dark:bg-slate-900">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-slate-800 dark:text-brand-300">
            Academic Opportunities • One Platform
          </span>

          <h1 className="mt-5 text-[2.5rem] font-bold leading-[1.1] text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            Your academic journey, elevated.
          </h1>
          <p className="mt-3 text-lg font-medium text-brand-600 dark:text-brand-400">
            Learn. Connect. Compete. Grow.
          </p>
          <p className="mt-4 max-w-lg text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            Courses, conferences, faculty development programs, hands-on
            training, competitions and career opportunities — all in one
            professional academic ecosystem.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#platform-categories"
              className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Explore ScholarAura →
            </Link>
            <Link
              href="/courses"
              className="rounded-lg border border-brand-200 px-6 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:border-slate-600 dark:text-brand-300 dark:hover:bg-slate-800"
            >
              Explore Courses
            </Link>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span aria-hidden className="text-brand-600 dark:text-brand-400">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div
          aria-hidden
          className="relative mx-auto flex h-72 w-full max-w-md items-center justify-center rounded-3xl bg-gradient-to-br from-brand-700 via-indigo-700 to-violet-800 sm:h-80 lg:h-96"
        >
          <div className="rounded-2xl bg-white/10 px-6 py-4 text-center backdrop-blur">
            <p className="text-sm font-semibold text-white">ScholarAura</p>
            <p className="text-xs text-brand-100">Academic Ecosystem</p>
          </div>

          {ECOSYSTEM_CARDS.map((card, i) => {
            const positions = [
              "left-2 top-4",
              "right-2 top-10",
              "left-4 bottom-6",
              "right-4 bottom-2",
              "left-1/2 top-0 -translate-x-1/2",
            ];
            return (
              <div
                key={card.label}
                className={`absolute ${positions[i]} hidden rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-lg sm:flex sm:items-center sm:gap-1.5`}
              >
                <span aria-hidden>{card.icon}</span>
                {card.label}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
