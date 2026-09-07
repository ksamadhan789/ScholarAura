import Link from "next/link";

const AUDIENCES = [
  {
    icon: "🎓",
    title: "For Students",
    points: ["Learn skills.", "Participate.", "Earn certificates.", "Discover opportunities."],
    cta: "Explore for Students",
    href: "/courses",
  },
  {
    icon: "🧑‍🏫",
    title: "For Faculty & Researchers",
    points: ["Develop professionally.", "Present your work.", "Connect with peers.", "Advance your career."],
    cta: "Explore for Faculty & Researchers",
    href: "/events?type=FDP",
  },
  {
    icon: "🏛",
    title: "For Institutions & Employers",
    points: ["Reach qualified academic professionals.", "Promote programs.", "Publish opportunities."],
    cta: "Explore for Organizations",
    href: "/recruiter/register",
  },
];

export function AudiencePaths() {
  return (
    <section className="bg-slate-50 py-16 dark:bg-slate-800/30">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
          Built around your academic journey
        </h2>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {AUDIENCES.map((audience) => (
            <div
              key={audience.title}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
            >
              <span aria-hidden className="text-3xl">{audience.icon}</span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {audience.title}
              </h3>
              <ul className="mt-3 flex-1 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {audience.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <Link
                href={audience.href}
                className="mt-5 rounded-lg border border-brand-200 px-4 py-2 text-center text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:border-slate-600 dark:text-brand-300 dark:hover:bg-slate-700"
              >
                {audience.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
