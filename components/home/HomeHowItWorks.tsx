import Link from "next/link";
import { Award, Search, UserPlus } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    title: "Create your free profile",
    text: "Sign up for free, then add your college or job role, a photo and your resume — once, for everything.",
  },
  {
    icon: Search,
    title: "Learn and take part",
    text: "Enroll in courses, register for conferences and workshops, or enter competitions — solo or as a team.",
  },
  {
    icon: Award,
    title: "Get certified and hired",
    text: "Earn certificates anyone can verify, show them on your portfolio, and apply for jobs and internships.",
  },
];

export function HomeHowItWorks() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 py-16">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          How it works
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          From sign-up to certificate to job
        </h2>
      </div>
      <ol className="grid gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <span className="absolute right-5 top-5 text-5xl font-extrabold text-slate-100 dark:text-slate-700">
              {i + 1}
            </span>
            <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <step.icon aria-hidden className="h-6 w-6" />
            </span>
            <h3 className="relative mt-5 text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
            <p className="relative mt-1 text-slate-600 dark:text-slate-400">{step.text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 text-center">
        <Link
          href="/register"
          className="inline-flex rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          Create your free account
        </Link>
      </div>
    </section>
  );
}
