import Link from "next/link";

export function HomeHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0), linear-gradient(to bottom right, #1d4ed8, #1e40af, #0f172a)",
        backgroundSize: "28px 28px, 100% 100%",
      }}
    >
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-20">
        <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-100">
          Academic Opportunities • One Platform
        </span>

        <h1 className="mt-5 text-4xl font-bold text-white sm:text-5xl">
          Your academic journey, elevated.
        </h1>
        <p className="mt-3 text-lg font-medium text-brand-200">
          Learn. Connect. Compete. Grow.
        </p>
        <p className="mx-auto mt-4 max-w-md text-brand-100">
          Courses, conferences, faculty development programs, hands-on training,
          competitions and career opportunities — all in one professional
          academic ecosystem.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="#platform-categories"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            Explore ScholarAura →
          </Link>
          <Link
            href="/courses"
            className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Explore Courses
          </Link>
        </div>
      </div>
    </section>
  );
}
