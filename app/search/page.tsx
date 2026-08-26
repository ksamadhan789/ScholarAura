import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Badge } from "@/components/Badge";
import { EVENT_TYPE_LABELS } from "@/lib/eventLabels";

export const dynamic = "force-dynamic";

export function generateMetadata({ searchParams }: { searchParams: { q?: string } }): Metadata {
  const q = searchParams.q?.trim();
  return { title: q ? `Search: ${q}` : "Search" };
}

const RESULT_LIMIT = 15;

function insensitive(q: string) {
  return { contains: q, mode: Prisma.QueryMode.insensitive };
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

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim() ?? "";

  if (!q) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="mb-4 text-2xl font-semibold">Search</h1>
        <p className="text-gray-500 dark:text-slate-400">
          Enter a search term to find courses, events, and competitions.
        </p>
      </main>
    );
  }

  const [courses, events, competitions] = await Promise.all([
    prisma.course.findMany({
      where: {
        isPublished: true,
        OR: [{ title: insensitive(q) }, { description: insensitive(q) }, { category: insensitive(q) }],
      },
      take: RESULT_LIMIT,
      orderBy: { createdAt: "desc" },
    }),
    prisma.event.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: insensitive(q) },
          { description: insensitive(q) },
          { shortDescription: insensitive(q) },
        ],
      },
      take: RESULT_LIMIT,
      orderBy: { startDate: "asc" },
    }),
    prisma.competition.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: insensitive(q) },
          { description: insensitive(q) },
          { shortDescription: insensitive(q) },
        ],
      },
      take: RESULT_LIMIT,
      orderBy: { startDate: "asc" },
    }),
  ]);

  const totalResults = courses.length + events.length + competitions.length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-1 text-2xl font-semibold">Search results for &ldquo;{q}&rdquo;</h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-slate-400">
        {totalResults} result{totalResults === 1 ? "" : "s"}
      </p>

      {totalResults === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          No courses, events, or competitions matched your search. Try a different term.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {courses.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold">📚 Courses</h2>
              <div className="flex flex-col gap-3">
                {courses.map((course) => (
                  <ResultRow
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    badge={course.category}
                    title={course.title}
                    subtitle={course.description}
                  />
                ))}
              </div>
            </section>
          )}

          {events.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold">📅 Events</h2>
              <div className="flex flex-col gap-3">
                {events.map((event) => (
                  <ResultRow
                    key={event.id}
                    href={`/events/${event.slug}`}
                    badge={EVENT_TYPE_LABELS[event.type]}
                    title={event.title}
                    subtitle={event.shortDescription ?? event.description}
                  />
                ))}
              </div>
            </section>
          )}

          {competitions.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold">🏆 Competitions</h2>
              <div className="flex flex-col gap-3">
                {competitions.map((competition) => (
                  <ResultRow
                    key={competition.id}
                    href={`/competitions/${competition.slug}`}
                    badge="Competition"
                    title={competition.title}
                    subtitle={competition.shortDescription ?? competition.description}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
