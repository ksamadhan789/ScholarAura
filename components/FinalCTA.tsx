import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="bg-gradient-to-br from-brand-700 via-indigo-700 to-violet-800 py-16">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Your next academic opportunity starts here.
        </h2>
        <p className="mt-3 text-brand-100">
          Learn something new. Meet the right people. Build your profile. Move your career forward.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            Join ScholarAura
          </Link>
          <Link
            href="#opportunities"
            className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Explore Opportunities →
          </Link>
        </div>
      </div>
    </section>
  );
}
