import Link from "next/link";

const CATEGORIES = [
  {
    icon: "📚",
    title: "Courses",
    description: "Build practical academic and professional skills through structured courses.",
    cta: "Explore Courses",
    href: "/courses",
  },
  {
    icon: "🌍",
    title: "Conferences",
    description: "Discover national and international conferences and connect with the academic community.",
    cta: "Explore Conferences",
    href: "/events",
  },
  {
    icon: "🎓",
    title: "Faculty Development",
    description: "Strengthen teaching, research and professional capabilities through FDPs and workshops.",
    cta: "Explore FDPs",
    href: "/events?type=FDP",
  },
  {
    icon: "🧪",
    title: "Hands-on Training",
    description: "Turn knowledge into practical experience through hands-on and VR-based training.",
    cta: "Explore Training",
    href: "/events?type=HANDS_ON_TRAINING",
  },
  {
    icon: "🏆",
    title: "Competitions",
    description: "Showcase your knowledge, creativity and academic skills.",
    cta: "Explore Competitions",
    href: "/competitions",
  },
  {
    icon: "💼",
    title: "Career Opportunities",
    description: "Discover academic and professional opportunities relevant to your career.",
    cta: "Explore Jobs",
    href: "/jobs",
  },
];

export function PlatformCategories() {
  return (
    <section id="platform-categories" className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
          Everything academic. One platform.
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          One professional ecosystem for learning, networking, development and career opportunities.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category) => (
          <Link
            key={category.title}
            href={category.href}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-600"
          >
            <span aria-hidden className="text-3xl">{category.icon}</span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
              {category.title}
            </h3>
            <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-300">
              {category.description}
            </p>
            <span className="mt-4 text-sm font-medium text-brand-600 group-hover:underline dark:text-brand-400">
              {category.cta} →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
