import Link from "next/link";
import { EVENT_TYPE_TABS } from "@/lib/eventLabels";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">ScholarAura</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Your academic journey, elevated.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Explore
            </p>
            <ul className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
              <li>
                <Link href="/courses" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Courses
                </Link>
              </li>
              {EVENT_TYPE_TABS.map(({ type, label }) => (
                <li key={type}>
                  <Link href={`/events?type=${type}`} className="hover:text-brand-600 dark:hover:text-brand-400">
                    {label.replace(/^\S+\s/, "")}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/competitions" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Competitions
                </Link>
              </li>
              <li>
                <Link href="/bundles" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Bundles
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Opportunities
            </p>
            <ul className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
              <li>
                <Link href="/jobs" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Jobs
                </Link>
              </li>
              <li>
                <Link href="/recruiter/register" className="hover:text-brand-600 dark:hover:text-brand-400">
                  For Employers
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Verify a Certificate
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Legal
            </p>
            <ul className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
              <li>
                <Link href="/terms" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          © {new Date().getFullYear()} ScholarAura. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
