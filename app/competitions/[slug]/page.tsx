import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EntryButton } from "./EntryButton";
import { SubmissionForm } from "./SubmissionForm";
import { PeopleList } from "@/components/PeopleList";
import { SaveButton } from "@/components/SaveButton";
import { Badge } from "@/components/Badge";
import { DetailHero } from "@/components/DetailHero";
import { InfoCard } from "@/components/InfoCard";
import { DateCards } from "@/components/DateCards";
import { PrizeCards } from "@/components/PrizeCards";
import { formatDateTime, getDeadlineUrgency } from "@/lib/eventLabels";
import { parseThemeTopic } from "@/lib/competitionCopy";
import type { EventPerson } from "@/lib/eventPeople";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const competition = await prisma.competition.findUnique({
    where: { slug: params.slug, isPublished: true },
    select: { title: true, description: true },
  });

  if (!competition) return {};

  return {
    title: competition.title,
    description: competition.description,
    openGraph: {
      title: competition.title,
      description: competition.description,
      type: "website",
    },
  };
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function CompetitionDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition || (!competition.isPublished && session?.user.role !== "ADMIN")) {
    notFound();
  }

  const [entry, currentUser, rates, winners, wishlistEntry] = session
    ? await Promise.all([
        prisma.competitionEntry.findUnique({
          where: { userId_competitionId: { userId: session.user.id, competitionId: competition.id } },
        }),
        prisma.user.findUnique({ where: { id: session.user.id } }),
        prisma.exchangeRate.findMany({ orderBy: { currencyCode: "asc" } }),
        prisma.competitionEntry.findMany({
          where: { competitionId: competition.id, status: "SUCCESS", rank: { in: [1, 2, 3] } },
          include: { user: { select: { name: true } } },
          orderBy: { rank: "asc" },
        }),
        prisma.competitionWishlist.findUnique({
          where: { userId_competitionId: { userId: session.user.id, competitionId: competition.id } },
        }),
      ])
    : [
        null,
        null,
        await prisma.exchangeRate.findMany({ orderBy: { currencyCode: "asc" } }),
        await prisma.competitionEntry.findMany({
          where: { competitionId: competition.id, status: "SUCCESS", rank: { in: [1, 2, 3] } },
          include: { user: { select: { name: true } } },
          orderBy: { rank: "asc" },
        }),
        null,
      ];

  const medalByRank: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const prizeByRank: Record<number, string | null> = {
    1: competition.prizeFirst,
    2: competition.prizeSecond,
    3: competition.prizeThird,
  };

  const serializedRates = rates.map((r) => ({
    currencyCode: r.currencyCode,
    symbol: r.symbol,
    rateFromInr: r.rateFromInr.toString(),
  }));

  const isEntered = entry?.status === "SUCCESS";
  const deadlinePassed = new Date() > competition.submissionDeadline;
  const urgency = getDeadlineUrgency(competition.submissionDeadline);
  const feeLabel = Number(competition.fee) === 0 ? "Free" : `₹${competition.fee}`;
  const themeTopic = parseThemeTopic(competition.description);

  const dateMilestones = [
    competition.registrationDeadline && {
      label: "Registration deadline",
      date: competition.registrationDeadline,
    },
    { label: "Submission deadline", date: competition.submissionDeadline, emphasize: true },
    competition.resultDate && { label: "Result declaration", date: competition.resultDate },
  ].filter((m): m is { label: string; date: Date; emphasize?: boolean } => Boolean(m));

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 sm:py-16">
      {!competition.isPublished && (
        <p className="mb-4 inline-block rounded bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-sm text-amber-800 dark:text-amber-300">
          Draft — not visible to the public yet
        </p>
      )}

      <DetailHero
        image={competition.thumbnailUrl}
        eyebrow="Competition"
        badges={
          <>
            <Badge variant={urgency.variant}>⏰ {urgency.label} to submit</Badge>
            {competition.eligibility && <Badge variant="neutral">🎓 {competition.eligibility}</Badge>}
            <Badge variant="brand">{feeLabel === "Free" ? "Free entry" : `Entry ${feeLabel}`}</Badge>
          </>
        }
        title={competition.title}
        meta={
          <>
            <span>
              📅 {formatDate(competition.startDate)} – {formatDate(competition.endDate)}
            </span>
            {competition.city && <span>📍 {competition.city}</span>}
          </>
        }
        actions={
          <>
            <a
              href="#register"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
            >
              Register Now ↓
            </a>
            {competition.brochureUrl && (
              <a
                href={competition.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                📄 Download Brochure
              </a>
            )}
          </>
        }
      />

      {themeTopic ? (
        <>
          {themeTopic.lead && (
            <p className="mt-4 text-gray-700 dark:text-slate-300">{themeTopic.lead}</p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InfoCard icon="🎯" title="Competition Theme">
              <p>{themeTopic.theme}</p>
            </InfoCard>
            <InfoCard icon="🖌️" title="Poster Topic">
              <p>{themeTopic.topic}</p>
            </InfoCard>
          </div>
        </>
      ) : (
        <>
          {competition.shortDescription && (
            <p className="mt-4 text-base text-gray-600 dark:text-slate-400">
              {competition.shortDescription}
            </p>
          )}
          <p className="mt-4 text-gray-700 dark:text-slate-300">{competition.description}</p>
        </>
      )}

      <DateCards milestones={dateMilestones} />
      {competition.registrationStartDate && (
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
          Registration opens {formatDateTime(competition.registrationStartDate)}
        </p>
      )}

      <PrizeCards
        first={competition.prizeFirst}
        second={competition.prizeSecond}
        third={competition.prizeThird}
        description={competition.prizeDescription}
      />

      {competition.eligibility && (
        <div className="mt-4">
          <InfoCard icon="🎓" title="Who can participate?" tone="success">
            <p>{competition.eligibility}</p>
          </InfoCard>
        </div>
      )}

      {winners.length > 0 && (
        <div className="mt-6">
          <InfoCard icon="🏆" title="Winners" tone="amber">
            {winners.map((winner) => (
              <div key={winner.id} className="flex items-center justify-between">
                <span>
                  {medalByRank[winner.rank as number] ?? "🏅"}{" "}
                  {winner.teamName ?? winner.user.name}
                </span>
                {winner.rank && prizeByRank[winner.rank] && <span>{prizeByRank[winner.rank]}</span>}
              </div>
            ))}
          </InfoCard>
        </div>
      )}

      <PeopleList people={(competition.people as unknown as EventPerson[] | null) ?? []} />

      {competition.maxTeamSize > 1 && (
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
          Teams of up to {competition.maxTeamSize} allowed.
        </p>
      )}

      <div
        id="register"
        className="mt-8 scroll-mt-24 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/60"
      >
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ready to take part?</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Entry fee: {feeLabel}</p>

        <div className="mt-4">
          {!session ? (
            <a
              href="/login"
              className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-5 py-2.5 text-white"
            >
              Log in to enter
            </a>
          ) : isEntered ? (
            <div className="flex flex-col gap-4">
              <p className="rounded bg-green-100 dark:bg-green-900/40 px-4 py-2.5 text-sm text-green-800 dark:text-green-300">
                🎉 You&apos;re entered in this competition!
                {entry?.rank ? ` — Result: #${entry.rank}` : ""}
              </p>
              <SubmissionForm
                slug={competition.slug}
                initialUrl={entry?.submissionUrl ?? ""}
                initialNotes={entry?.submissionNotes ?? ""}
                deadlinePassed={deadlinePassed}
              />
            </div>
          ) : deadlinePassed ? (
            <p className="rounded bg-gray-100 dark:bg-slate-700 px-4 py-2.5 text-sm text-gray-600 dark:text-slate-400">
              Entries are closed for this competition
            </p>
          ) : (
            <>
              {Number(competition.fee) > 0 && currentUser && Number(currentUser.creditBalance) > 0 && (
                <p className="mb-2 text-sm text-green-700 dark:text-green-400">
                  You have ₹{Number(currentUser.creditBalance).toFixed(2)} credit — applied
                  automatically when paying in INR.
                </p>
              )}
              <EntryButton
                slug={competition.slug}
                isPaid={Number(competition.fee) > 0}
                price={Number(competition.fee)}
                rates={serializedRates}
                allowTeam={competition.maxTeamSize > 1}
                userName={session.user.name}
                userEmail={session.user.email}
              />
            </>
          )}
        </div>

        {competition.brochureUrl && (
          <a
            href={competition.brochureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            📄 Download brochure
          </a>
        )}
      </div>

      {session && !isEntered && (
        <div className="mt-3">
          <SaveButton
            endpoint={`/api/competitions/${competition.slug}/wishlist`}
            isSaved={!!wishlistEntry}
          />
        </div>
      )}
    </main>
  );
}
