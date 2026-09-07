import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Badge } from "@/components/Badge";
import { EVENT_TYPE_LABELS } from "@/lib/eventLabels";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/jobLabels";

export const dynamic = "force-dynamic";

export function generateMetadata({ searchParams }: { searchParams: { q?: string } }): Metadata {
  const q = searchParams.q?.trim();
  return { title: q ? `Search: ${q}` : "Search" };
}

const RESULT_LIMIT = 15;

type SearchType = "all" | "courses" | "events" | "competitions" | "jobs" | "bundles";

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

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string };
}) {
  const q = searchParams.q?.trim() ?? "";
  const validTypes: readonly string[] = ["courses", "events", "competitions", "jobs", "bundles"];
  const type: SearchType = validTypes.includes(searchParams.type ?? "")
    ? (searchParams.type as SearchType)
    : "all";

  if (!q) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="mb-4 text-2xl font-semibold">Search</h1>
        <p className="text-gray-500 dark:text-slate-400">
          Enter a search term to find courses, events, competitions, jobs, and bundles.
        </p>
      </main>
    );
  }

  const wantCourses = type === "all" || type === "courses";
  const wantEvents = type === "all" || type === "events";
  const wantCompetitions = type === "all" || type === "competitions";
  const wantJobs = type === "all" || type === "jobs";
  const wantBundles = type === "all" || type === "bundles";

  const [courses, events, competitions, jobs, bundles] = await Promise.all([
    wantCourses
      ? prisma.course.findMany({
          where: {
            isPublished: true,
            OR: [{ title: insensitive(q) }, { description: insensitive(q) }, { category: insensitive(q) }],
          },
          take: RESULT_LIMIT,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    wantEvents
      ? prisma.event.findMany({
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
        })
      : Promise.resolve([]),
    wantCompetitions
      ? prisma.competition.findMany({
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
        })
      : Promise.resolve([]),
    wantJobs
      ? prisma.job.findMany({
          where: {
            isPublished: true,
            OR: [
              { title: insensitive(q) },
              { companyName: insensitive(q) },
              { location: insensitive(q) },
              { description: insensitive(q) },
            ],
          },
          take: RESULT_LIMIT,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    wantBundles
      ? prisma.courseBundle.findMany({
          where: {
            isPublished: true,
            OR: [{ title: insensitive(q) }, { description: insensitive(q) }],
          },
          take: RESULT_LIMIT,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const totalResults = courses.length + events.length + competitions.length + jobs.length + bundles.length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-1 text-2xl font-semibold">Search results for &ldquo;{q}&rdquo;</h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-slate-400">
        {totalResults} result{totalResults === 1 ? "" : "s"}
      </p>

      {totalResults === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          No matches found. Try a different term{type !== "all" ? " or search All categories" : ""}.
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

          {bundles.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold">🎁 Bundles</h2>
              <div className="flex flex-col gap-3">
                {bundles.map((bundle) => (
                  <ResultRow
                    key={bundle.id}
                    href={`/bundles/${bundle.slug}`}
                    badge="Bundle"
                    title={bundle.title}
                    subtitle={bundle.description}
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

          {jobs.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold">💼 Jobs</h2>
              <div className="flex flex-col gap-3">
                {jobs.map((job) => (
                  <ResultRow
                    key={job.id}
                    href={`/jobs/${job.slug}`}
                    badge={EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                    title={`${job.title} at ${job.companyName}`}
                    subtitle={job.isRemote ? "Remote" : job.location}
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
