import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { Thumbnail } from "@/components/Thumbnail";

export const metadata: Metadata = {
  title: "Competitions",
  description: "Competitions hosted on ScholarAura — submit an entry and compete for prizes.",
};

// No dynamic API (cookies/searchParams/getServerSession) here to naturally
// opt this out of static prerendering — same fix as /courses (see its
// comment) to avoid needing DB access at build time.
export const dynamic = "force-dynamic";

function formatDeadline(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function CompetitionCard({
  competition,
}: {
  competition: {
    slug: string;
    title: string;
    submissionDeadline: Date;
    fee: unknown;
    thumbnailUrl: string | null;
  };
}) {
  return (
    <Link
      href={`/competitions/${competition.slug}`}
      className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
    >
      <Thumbnail url={competition.thumbnailUrl} alt={competition.title} icon="🏆" />
      <div className="p-4">
        <Badge variant="brand">Competition</Badge>
        <h3 className="mt-2 font-medium text-slate-900 dark:text-white">{competition.title}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          Submit by {formatDeadline(competition.submissionDeadline)}
        </p>
        <p className="mt-2 font-semibold text-slate-900 dark:text-white">
          {Number(competition.fee) === 0 ? "Free" : `₹${competition.fee}`}
        </p>
      </div>
    </Link>
  );
}

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();

  const competitions = await prisma.competition.findMany({
    where: {
      isPublished: true,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { shortDescription: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { startDate: "asc" },
  });

  const now = new Date();
  const open = competitions.filter((c) => c.submissionDeadline >= now);
  const closed = competitions.filter((c) => c.submissionDeadline < now);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">🏆 Competitions</h1>

      <form className="mb-8 flex flex-wrap gap-2" action="/competitions">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by title or description..."
          className="min-w-[200px] flex-1 rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
        />
        <button
          type="submit"
          className="rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      {competitions.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          👀 No competitions {q ? "matched your search" : "published yet"} — check back soon!
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {open.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                🟢 Open for entries
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {open.map((c) => (
                  <CompetitionCard key={c.id} competition={c} />
                ))}
              </div>
            </section>
          )}

          {closed.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">🔒 Closed</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {closed.map((c) => (
                  <CompetitionCard key={c.id} competition={c} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
