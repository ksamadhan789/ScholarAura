import Link from "next/link";
import { Quote, Star } from "lucide-react";
import type { TrustStat } from "@/lib/trustSignals";
import type { HomeTestimonial } from "@/lib/homeTrustStats";

// "ScholarAura so far" numbers plus real learner reviews. Both halves hide
// themselves until there's enough real data (see lib/trustSignals.ts), and
// the whole section disappears when neither has anything to show.
export function HomeTrustSection({ stats, testimonials }: { stats: TrustStat[]; testimonials: HomeTestimonial[] }) {
  if (stats.length === 0 && testimonials.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 py-12">
      {stats.length > 0 && (
        <div className="rounded-2xl bg-navy-900 px-6 py-8 text-white sm:px-10 dark:ring-1 dark:ring-slate-700">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-sky-300">ScholarAura so far</p>
          <dl className="mt-6 grid grid-cols-2 gap-6 text-center sm:grid-cols-3 lg:flex lg:justify-around">
            {stats.map((stat) => (
              <div key={stat.key}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-3xl font-extrabold sm:text-4xl">{stat.value}</dd>
                <dd className="mt-1 text-sm text-slate-300">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {testimonials.length > 0 && (
        <div className={stats.length > 0 ? "mt-12" : undefined}>
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              What learners say
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Reviews from our courses
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <Quote aria-hidden className="h-6 w-6 text-brand-200 dark:text-slate-600" />
                <div className="mt-3 flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      aria-hidden
                      className={`h-4 w-4 ${i < t.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
                    />
                  ))}
                </div>
                <blockquote className="mt-3 line-clamp-5 flex-1 text-slate-700 dark:text-slate-200">{t.comment}</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">{t.reviewerName}</span>
                  <span className="text-slate-500 dark:text-slate-400"> on </span>
                  <Link
                    href={`/courses/${t.courseSlug}`}
                    className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {t.courseTitle}
                  </Link>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
