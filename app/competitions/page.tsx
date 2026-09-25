import type { Metadata } from "next";
import { Clock, MapPin, Trophy, Users } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { SaveButton } from "@/components/SaveButton";
import { MediaCard, PriceTag } from "@/components/listing/MediaCard";
import {
  CardGrid,
  EmptyState,
  FILTER_FIELD_CLASS,
  FilterActions,
  FilterGroup,
  FilterPanel,
  ListingHeader,
  ListingShell,
  ResultsSection,
} from "@/components/listing/ListingLayout";
import { getDeadlineUrgency } from "@/lib/eventLabels";
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
  const urgency = getDeadlineUrgency(competition.submissionDeadline);
  return (
    <MediaCard
      href={`/competitions/${competition.slug}`}
      thumbnailUrl={competition.thumbnailUrl}
      placeholderIcon={<Trophy className="h-10 w-10" />}
      title={competition.title}
      badges={
        <>
          <Badge variant="brand">Competition</Badge>
          {urgency && <Badge variant={urgency.variant}>{urgency.label}</Badge>}
        </>
      }
      meta={[
        { icon: Clock, text: `Submit by ${formatDeadline(competition.submissionDeadline)}` },
        {
          icon: Users,
          text: competition.maxTeamSize > 1 ? `Teams of up to ${competition.maxTeamSize}` : "Individual entry",
        },
        ...(competition.city ? [{ icon: MapPin, text: competition.city }] : []),
      ]}
      footer={<PriceTag amount={competition.fee} freeLabel="Free entry" />}
      overlay={
        isSaved !== null && (
          <SaveButton
            endpoint={`/api/competitions/${competition.slug}/wishlist`}
            isSaved={isSaved}
            variant="overlay"
          />
        )
      }
    />
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

  const hasFilters = Boolean(q || activeTeam || activeCity);

  return (
    <main>
      <ListingHeader
        title="Competitions"
        subtitle="Enter individually or as a team, submit your work and compete for prizes and certificates."
      />

      <ListingShell
        sidebar={
          <FilterPanel action="/competitions">
            <FilterGroup label="Search">
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Title or description…"
                className={FILTER_FIELD_CLASS}
              />
            </FilterGroup>
            <FilterGroup label="Team size">
              <select name="team" defaultValue={activeTeam ?? ""} className={FILTER_FIELD_CLASS}>
                {TEAM_SIZE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FilterGroup>
            <FilterGroup label="Location">
              <select name="city" defaultValue={activeCity ?? ""} className={FILTER_FIELD_CLASS}>
                <option value="">Any location</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </FilterGroup>
            <FilterActions clearHref={hasFilters ? "/competitions" : undefined} />
          </FilterPanel>
        }
      >
        {competitions.length === 0 ? (
          <EmptyState
            title={hasFilters ? "No competitions match your search" : "No competitions yet"}
            text={hasFilters ? "Try removing a filter or searching for something else." : "New competitions are added regularly — check back soon."}
          />
        ) : (
          <div className="flex flex-col gap-10">
            {open.length > 0 && (
              <ResultsSection title="Open for entries" count={open.length}>
                <CardGrid>
                  {open.map((c) => (
                    <CompetitionCard key={c.id} competition={c} isSaved={savedCompetitionIds ? savedCompetitionIds.has(c.id) : null} />
                  ))}
                </CardGrid>
              </ResultsSection>
            )}

            {closed.length > 0 && (
              <ResultsSection title="Closed" count={closed.length}>
                <CardGrid>
                  {closed.map((c) => (
                    <CompetitionCard key={c.id} competition={c} isSaved={savedCompetitionIds ? savedCompetitionIds.has(c.id) : null} />
                  ))}
                </CardGrid>
              </ResultsSection>
            )}
          </div>
        )}
      </ListingShell>
    </main>
  );
}
