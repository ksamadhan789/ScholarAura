import Link from "next/link";

const BENEFITS = [
  "Publish jobs",
  "Reach relevant candidates",
  "Build your employer presence",
  "Promote academic opportunities",
];

export function EmployerCTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-col items-center gap-8 rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800 sm:p-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Are you hiring academic talent?
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Connect with students, faculty, researchers and professionals actively looking for their next opportunity.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2">
              <span aria-hidden className="text-brand-600 dark:text-brand-400">✓</span>
              {benefit}
            </li>
          ))}
        </ul>

        <Link
          href="/recruiter/register"
          className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Post an Opportunity
        </Link>
      </div>
    </section>
  );
}
