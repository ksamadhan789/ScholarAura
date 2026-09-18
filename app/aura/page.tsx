import Link from "next/link";
import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { matchAuraFaq } from "@/lib/auraFaq";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aura",
  description: "Aura helps you find courses, events, competitions, jobs, and freelance work on ScholarAura.",
};

const RESULT_LIMIT = 5;

function insensitive(q: string) {
  return { contains: q, mode: Prisma.QueryMode.insensitive };
}

const SUGGESTED_PROMPTS = [
  "Find a course",
  "Find a job",
  "Find an event",
  "How do certificates work?",
  "How do I get a refund?",
  "What is Alumni Meet?",
  "How do I post freelance work?",
];

function ResultRow({
  href,
  badge,
  title,
  subtitle,
}: {
  href: string;
  badge: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-gray-200 dark:border-slate-700 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
    >
      <Badge variant="brand">{badge}</Badge>
      <h3 className="mt-2 font-medium text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{subtitle}</p>
    </Link>
  );
}

export default async function AuraPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim() ?? "";
  const faqAnswer = q ? matchAuraFaq(q) : null;

  // Skip the live search entirely when a canned FAQ answer already matched —
  // it comes with its own direct link, and a title/category search for
  // something like "how do refunds work" wouldn't turn up anything relevant
  // anyway, so there's no reason to spend a DB round trip on it.
  const [courses, events, competitions, jobs, freelance] = q && !faqAnswer
    ? await Promise.all([
        prisma.course.findMany({
          where: {
            isPublished: true,
            OR: [{ title: insensitive(q) }, { category: insensitive(q) }],
          },
          take: RESULT_LIMIT,
          orderBy: { createdAt: "desc" },
        }),
        prisma.event.findMany({
          where: { isPublished: true, OR: [{ title: insensitive(q) }, { shortDescription: insensitive(q) }] },
          take: RESULT_LIMIT,
          orderBy: { startDate: "asc" },
        }),
        prisma.competition.findMany({
          where: { isPublished: true, OR: [{ title: insensitive(q) }, { shortDescription: insensitive(q) }] },
          take: RESULT_LIMIT,
          orderBy: { startDate: "asc" },
        }),
        prisma.job.findMany({
          where: { isPublished: true, OR: [{ title: insensitive(q) }, { companyName: insensitive(q) }] },
          take: RESULT_LIMIT,
          orderBy: { createdAt: "desc" },
        }),
        prisma.freelanceListing.findMany({
          where: { isPublished: true, OR: [{ title: insensitive(q) }, { category: insensitive(q) }] },
          take: RESULT_LIMIT,
          orderBy: { createdAt: "desc" },
        }),
      ])
    : [[], [], [], [], []];

  const totalResults = courses.length + events.length + competitions.length + jobs.length + freelance.length;

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold">🤖 Aura</h1>
      <p className="mt-2 text-gray-600 dark:text-slate-400">
        Ask what you&rsquo;re looking for, or how something on ScholarAura works.
      </p>

      <form className="mt-6 flex gap-2" action="/aura">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="e.g. web development courses, how do refunds work..."
          className="min-w-0 flex-1 rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          autoFocus
        />
        <button
          type="submit"
          className="rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
        >
          Ask Aura
        </button>
      </form>

      {!q && (
        <div className="mt-6 flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <Link
              key={prompt}
              href={`/aura?q=${encodeURIComponent(prompt)}`}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {prompt}
            </Link>
          ))}
        </div>
      )}

      {q && (
        <div className="mt-8 flex flex-col gap-8">
          {faqAnswer && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
              <p className="text-slate-700 dark:text-slate-200">{faqAnswer.answer}</p>
              {faqAnswer.href && (
                <Link
                  href={faqAnswer.href}
                  className="mt-2 inline-block text-sm font-medium text-brand-700 underline dark:text-brand-400"
                >
                  {faqAnswer.linkLabel ?? "Learn more"} →
                </Link>
              )}
            </div>
          )}

          {totalResults === 0 ? (
            !faqAnswer && (
              <p className="text-gray-500 dark:text-slate-400">
                I couldn&rsquo;t find anything for &ldquo;{q}&rdquo;. Try browsing{" "}
                <Link href="/courses" className="text-brand-600 underline dark:text-brand-400">
                  courses
                </Link>
                ,{" "}
                <Link href="/events" className="text-brand-600 underline dark:text-brand-400">
                  events
                </Link>
                , or{" "}
                <Link href="/jobs" className="text-brand-600 underline dark:text-brand-400">
                  jobs
                </Link>{" "}
                directly.
              </p>
            )
          ) : (
            <div className="flex flex-col gap-6">
              {courses.length > 0 && (
                <section>
                  <h2 className="mb-3 font-semibold">📚 Courses</h2>
                  <div className="flex flex-col gap-3">
                    {courses.map((c) => (
                      <ResultRow
                        key={c.id}
                        href={`/courses/${c.slug}`}
                        badge={c.category}
                        title={c.title}
                        subtitle={c.description}
                      />
                    ))}
                  </div>
                </section>
              )}

              {events.length > 0 && (
                <section>
                  <h2 className="mb-3 font-semibold">📅 Events</h2>
                  <div className="flex flex-col gap-3">
                    {events.map((e) => (
                      <ResultRow
                        key={e.id}
                        href={`/events/${e.slug}`}
                        badge="Event"
                        title={e.title}
                        subtitle={e.shortDescription ?? e.description}
                      />
                    ))}
                  </div>
                </section>
              )}

              {competitions.length > 0 && (
                <section>
                  <h2 className="mb-3 font-semibold">🏆 Competitions</h2>
                  <div className="flex flex-col gap-3">
                    {competitions.map((c) => (
                      <ResultRow
                        key={c.id}
                        href={`/competitions/${c.slug}`}
                        badge="Competition"
                        title={c.title}
                        subtitle={c.shortDescription ?? c.description}
                      />
                    ))}
                  </div>
                </section>
              )}

              {jobs.length > 0 && (
                <section>
                  <h2 className="mb-3 font-semibold">💼 Jobs</h2>
                  <div className="flex flex-col gap-3">
                    {jobs.map((j) => (
                      <ResultRow
                        key={j.id}
                        href={`/jobs/${j.slug}`}
                        badge={j.employmentType}
                        title={`${j.title} at ${j.companyName}`}
                        subtitle={j.isRemote ? "Remote" : j.location}
                      />
                    ))}
                  </div>
                </section>
              )}

              {freelance.length > 0 && (
                <section>
                  <h2 className="mb-3 font-semibold">🧰 Freelance</h2>
                  <div className="flex flex-col gap-3">
                    {freelance.map((f) => (
                      <ResultRow
                        key={f.id}
                        href={`/freelance/${f.slug}`}
                        badge={f.category}
                        title={f.title}
                        subtitle={f.description}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
