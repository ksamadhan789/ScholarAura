const BENEFITS = [
  {
    icon: "🎯",
    title: "Learn with Purpose",
    description: "Access structured learning designed around real academic and professional needs.",
  },
  {
    icon: "🤝",
    title: "Connect with Academia",
    description: "Meet educators, researchers, professionals and institutions.",
  },
  {
    icon: "🏅",
    title: "Build Your Profile",
    description: "Participate in programs, competitions and training and earn certificates.",
  },
  {
    icon: "🧭",
    title: "Discover Opportunities",
    description: "Find courses, conferences, jobs and academic opportunities in one place.",
  },
];

export function WhyScholarAura() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
          Why ScholarAura?
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          One platform. Multiple opportunities.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <span aria-hidden className="text-3xl">{benefit.icon}</span>
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{benefit.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
