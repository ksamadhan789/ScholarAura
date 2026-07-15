import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="flex flex-1 flex-col">
      <section className="bg-gradient-to-b from-brand-50 to-white dark:from-slate-800 dark:to-slate-900">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            For professionals, academics & students worldwide
          </span>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl">
            ScholarAura
          </h1>
          <p className="max-w-xl text-lg text-slate-600 dark:text-slate-400 dark:text-slate-400">
            Courses, international & national conferences, faculty development
            programs, and hands-on trainings — all in one place.
          </p>

          {session ? (
            <Link
              href="/dashboard"
              className="rounded bg-brand-600 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-700"
            >
              Go to your dashboard
            </Link>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="rounded bg-brand-600 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-700"
              >
                Sign up free
              </Link>
              <Link
                href="/login"
                className="rounded border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Log in
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-4 px-4 py-16 sm:grid-cols-3">
        <Link
          href="/courses"
          className="rounded-lg border border-slate-200 p-6 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:hover:border-brand-700 dark:hover:bg-slate-800"
        >
          <p className="text-2xl">🎥</p>
          <h2 className="mt-2 font-semibold text-slate-900 dark:text-white">Prerecorded courses</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Learn at your own pace with lifetime access and certificates.
          </p>
        </Link>
        <Link
          href="/events"
          className="rounded-lg border border-slate-200 p-6 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:hover:border-brand-700 dark:hover:bg-slate-800"
        >
          <p className="text-2xl">🌍</p>
          <h2 className="mt-2 font-semibold text-slate-900 dark:text-white">
            Conferences & FDPs
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Register for international and national events, online or in person.
          </p>
        </Link>
        <Link
          href="/verify"
          className="rounded-lg border border-slate-200 p-6 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:hover:border-brand-700 dark:hover:bg-slate-800"
        >
          <p className="text-2xl">📜</p>
          <h2 className="mt-2 font-semibold text-slate-900 dark:text-white">
            Verified certificates
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Every certificate has a unique code anyone can verify instantly.
          </p>
        </Link>
      </section>
    </main>
  );
}
