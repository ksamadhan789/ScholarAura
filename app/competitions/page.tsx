import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { Thumbnail } from "@/components/Thumbnail";
import { SaveButton } from "@/components/SaveButton";
import { readLocationCookie } from "@/lib/location";

export const metadata: Metadata = {
  title: "Competitions",
  description: "Competitions hosted on ScholarAura — submit an entry and compete for prizes.",
};

// getServerSession also opts this out of static prerendering now, but keep
// this explicit — same fix as /courses (see its comment) — since it doesn't
// depend on that call staying here.
export const dynamic = "force-dynamic";

function formatDeadline(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function CompetitionCard({
  competition,
  isSaved,
}: {
  competition: {
    id: string;
    slug: string;
    title: string;
    submissionDeadline: Date;
    fee: unknown;
    maxTeamSize: number;
    thumbnailUrl: string | null;
    city: string | null;
  };
  isSaved: boolean | null;
}) {
  return (
    <div className="relative">
      {isSaved !== null && (
        <div className="absolute right-2 top-2 z-10">
          <SaveButton
            endpoint={`/api/competitions/${competition.slug}/wishlist`}
            isSaved={isSaved}
            variant="overlay"
          />
        </div>
      )}
      <Link
        href={`/competitions/${competition.slug}`}
        className="block overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
      >
        <Thumbnail url={competition.thumbnailUrl} alt={competition.title} icon="🏆" />
        <div className="p-4">
          <Badge variant="brand">Competition</Badge>
          <h3 className="mt-2 font-medium text-slate-900 dark:text-white">{competition.title}</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            Submit by {formatDeadline(competition.submissionDeadline)} ·{" "}
            {competition.maxTeamSize > 1 ? `Team of up to ${competition.maxTeamSize}` : "Individual"}
            {competition.city && ` · ${competition.city}`}
          </p>
          <p className="mt-2 font-semibold text-slate-900 dark:text-white">
            {Number(competition.fee) === 0 ? "Free" : `₹${competition.fee}`}
          </p>
        </div>
      </Link>
    </div>
  );
}

const TEAM_SIZE_OPTIONS = [
  { value: "", label: "Any team size" },
  { value: "individual", label: "Individual" },
  { value: "team", label: "Team" },
];

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: { q?: string; team?: string; city?: string };
}) {
  const session = await getServerSession(authOptions);
  const q = searchParams.q?.trim();
  const activeTeam = searchParams.team;
  // Same "present but empty means explicitly cleared" rule as /events.
  const activeCity = searchParams.city !== undefined ? searchParams.city || undefined : readLocationCookie();

  const [competitions, cityRows] = await Promise.all([
    prisma.competition.findMany({
      where: {
        isPublished: true,
        ...(activeTeam === "individual"
          ? { maxTeamSize: 1 }
          : activeTeam === "team"
            ? { maxTeamSize: { gt: 1 } }
            : {}),
        ...(activeCity ? { city: activeCity } : {}),
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
    }),
    // Independent of the filters above, so the Location dropdown always
    // lists every city with a published competition — same pattern as
    // /events.
    prisma.competition.findMany({
      where: { isPublished: true, city: { not: null } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
  ]);
  const cities = cityRows.map((r) => r.city as string);

  const savedCompetitionIds = session
    ? new Set(
        (
          await prisma.competitionWishlist.findMany({
            where: { userId: session.user.id, competitionId: { in: competitions.map((c) => c.id) } },
            select: { competitionId: true },
          })
        ).map((w) => w.competitionId)
      )
    : null;

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
        <select
          name="team"
          defaultValue={activeTeam ?? ""}
          className="rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
        >
          {TEAM_SIZE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="city"
          defaultValue={activeCity ?? ""}
          className="rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
        >
          <option value="">Any location</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
        >
          Search
        </button>
        {(q || activeTeam || activeCity) && (
          <Link
            href="/competitions"
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Clear filters
          </Link>
        )}
      </form>

      {competitions.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          👀 No competitions {q || activeTeam || activeCity ? "matched your search" : "published yet"} —
          check back soon!
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
                  <CompetitionCard key={c.id} competition={c} isSaved={savedCompetitionIds ? savedCompetitionIds.has(c.id) : null} />
                ))}
              </div>
            </section>
          )}

          {closed.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">🔒 Closed</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {closed.map((c) => (
                  <CompetitionCard key={c.id} competition={c} isSaved={savedCompetitionIds ? savedCompetitionIds.has(c.id) : null} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
