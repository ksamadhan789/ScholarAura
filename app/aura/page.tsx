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
  "What is Meet Alumni?",
  "How do I post freelance work?",
];

function AuraAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-8 w-8 text-base" : "h-12 w-12 text-2xl";
  return (
    <div
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 shadow-lg shadow-brand-500/30`}
    >
      🤖
    </div>
  );
}

function AuraBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <AuraAvatar size="sm" />
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {children}
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-600 px-4 py-2.5 text-sm text-white">
        {children}
      </div>
    </div>
  );
}

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

  const resultSections: { label: string; items: { id: string; href: string; badge: string; title: string; subtitle: string }[] }[] = [
    {
      label: "📚 Courses",
      items: courses.map((c) => ({
        id: c.id,
        href: `/courses/${c.slug}`,
        badge: c.category,
        title: c.title,
        subtitle: c.description,
      })),
    },
    {
      label: "📅 Events",
      items: events.map((e) => ({
        id: e.id,
        href: `/events/${e.slug}`,
        badge: "Event",
        title: e.title,
        subtitle: e.shortDescription ?? e.description,
      })),
    },
    {
      label: "🏆 Competitions",
      items: competitions.map((c) => ({
        id: c.id,
        href: `/competitions/${c.slug}`,
        badge: "Competition",
        title: c.title,
        subtitle: c.shortDescription ?? c.description,
      })),
    },
    {
      label: "💼 Jobs",
      items: jobs.map((j) => ({
        id: j.id,
        href: `/jobs/${j.slug}`,
        badge: j.employmentType,
        title: `${j.title} at ${j.companyName}`,
        subtitle: j.isRemote ? "Remote" : j.location,
      })),
    },
    {
      label: "🧰 Freelance",
      items: freelance.map((f) => ({
        id: f.id,
        href: `/freelance/${f.slug}`,
        badge: f.category,
        title: f.title,
        subtitle: f.description,
      })),
    },
  ];

  return (
    <main className="mx-auto max-w-2xl bg-gradient-to-b from-brand-50/60 to-transparent px-4 py-10 dark:from-brand-900/25">
      <div className="flex items-center gap-3">
        <AuraAvatar />
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Aura</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Your ScholarAura guide</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 p-5">
          <AuraBubble>
            👋 Hi, I&rsquo;m Aura! Ask me to find something on ScholarAura, or how a feature works.
          </AuraBubble>

          {!q && (
            <div className="ml-[calc(2rem+0.625rem)] flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <Link
                  key={prompt}
                  href={`/aura?q=${encodeURIComponent(prompt)}`}
                  className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/40"
                >
                  {prompt}
                </Link>
              ))}
            </div>
          )}

          {q && (
            <>
              <UserBubble>{q}</UserBubble>

              <div className="flex items-start gap-2.5">
                <AuraAvatar size="sm" />
                <div className="flex max-w-[85%] flex-col gap-3">
                  <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {faqAnswer
                      ? faqAnswer.answer
                      : totalResults > 0
                        ? `Here's what I found for "${q}":`
                        : `Hmm, I couldn't find anything for "${q}".`}
                  </div>

                  {faqAnswer?.href && (
                    <Link
                      href={faqAnswer.href}
                      className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                    >
                      {faqAnswer.linkLabel ?? "Learn more"} →
                    </Link>
                  )}

                  {totalResults > 0 && (
                    <div className="flex flex-col gap-5">
                      {resultSections
                        .filter((section) => section.items.length > 0)
                        .map((section) => (
                          <section key={section.label}>
                            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                              {section.label}
                            </h2>
                            <div className="flex flex-col gap-2">
                              {section.items.map((item) => (
                                <ResultRow key={item.id} {...item} />
                              ))}
                            </div>
                          </section>
                        ))}
                    </div>
                  )}

                  {totalResults === 0 && !faqAnswer && (
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="/courses"
                        className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Browse courses
                      </Link>
                      <Link
                        href="/events"
                        className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Browse events
                      </Link>
                      <Link
                        href="/jobs"
                        className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Browse jobs
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <form
          action="/aura"
          className="flex items-center gap-2 border-t border-gray-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
        >
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="e.g. web development courses, how do refunds work..."
            className="min-w-0 flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            autoFocus
          />
          <button
            type="submit"
            aria-label="Ask Aura"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M2.94 2.94a1.5 1.5 0 0 1 1.61-.34l12.5 5a1.5 1.5 0 0 1 0 2.8l-12.5 5a1.5 1.5 0 0 1-2.03-1.83L3.9 10 2.52 4.77a1.5 1.5 0 0 1 .42-1.83Z" />
            </svg>
          </button>
        </form>
      </div>
    </main>
  );
}
