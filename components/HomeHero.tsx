import Link from "next/link";

export function HomeHero() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-20">
      <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-slate-800 dark:text-brand-300">
        Academic Opportunities • One Platform
      </span>

      <h1 className="mt-5 text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl">
        Your academic journey, elevated.
      </h1>
      <p className="mt-3 text-lg font-medium text-brand-600 dark:text-brand-400">
        Learn. Connect. Compete. Grow.
      </p>
      <p className="mx-auto mt-4 max-w-md text-slate-600 dark:text-slate-300">
        Courses, conferences, faculty development programs, hands-on training,
        competitions and career opportunities — all in one professional
        academic ecosystem.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
    </section>
  );
}
