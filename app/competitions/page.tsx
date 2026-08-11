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

export default async function CompetitionsPage() {
  const competitions = await prisma.competition.findMany({
    where: { isPublished: true },
    orderBy: { startDate: "asc" },
  });

  const now = new Date();
  const open = competitions.filter((c) => c.submissionDeadline >= now);
  const closed = competitions.filter((c) => c.submissionDeadline < now);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">🏆 Competitions</h1>

      {competitions.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          👀 No competitions published yet — check back soon!
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
