import { notFound } from "next/navigation";
import { ShareButtons } from "@/components/ShareButtons";
import { SITE_URL } from "@/lib/siteUrl";
import { CalendarDays, Clock, FileText, MapPin, Users } from "lucide-react";
import { ActionCard, ActionStatus, ACTION_PRIMARY_CLASS, DetailColumns } from "@/components/detail/DetailLayout";
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
            <Badge variant={urgency.variant}>{urgency.label} to submit</Badge>
            {competition.eligibility && <Badge variant="neutral">{competition.eligibility}</Badge>}
            <Badge variant="brand">{feeLabel === "Free" ? "Free entry" : `Entry ${feeLabel}`}</Badge>
          </>
        }
        title={competition.title}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden className="h-4 w-4" />
              {formatDate(competition.startDate)} – {formatDate(competition.endDate)}
            </span>
            {competition.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden className="h-4 w-4" />
                {competition.city}
              </span>
            )}
          </>
        }
        actions={
          <>
            <a
              href="#register"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
            >
              {isEntered ? "Your entry ↓" : "Register now ↓"}
            </a>
            {competition.brochureUrl && (
              <a
                href={competition.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <FileText aria-hidden className="h-4 w-4" />
                Download brochure
              </a>
            )}
          </>
        }
      />

      <DetailColumns
        aside={
          <ActionCard
            label="Entry fee"
            price={feeLabel}
            priceNote={
              <span className="inline-flex items-center gap-1.5">
                <Clock aria-hidden className="h-4 w-4" />
                Submit by {formatDateTime(competition.submissionDeadline)}
              </span>
            }
            footer={
              <>
                {competition.maxTeamSize > 1 && (
                  <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Users aria-hidden className="h-4 w-4" />
                    Teams of up to {competition.maxTeamSize}
                  </p>
                )}
                {competition.brochureUrl && (
                  <a
                    href={competition.brochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    <FileText aria-hidden className="h-4 w-4" />
                    Download brochure
                  </a>
                )}
                {session && !isEntered && (
                  <SaveButton
                    endpoint={`/api/competitions/${competition.slug}/wishlist`}
                    isSaved={!!wishlistEntry}
                  />
                )}
                {competition.isPublished && (
                  <ShareButtons url={`${SITE_URL}/competitions/${competition.slug}`} title={competition.title} />
                )}
              </>
            }
          >
            {!session ? (
              <a href="/login" className={ACTION_PRIMARY_CLASS}>
                Log in to enter
              </a>
            ) : isEntered ? (
              <>
                <ActionStatus tone="success">
                  You&apos;re entered in this competition!
                  {entry?.rank ? ` Result: #${entry.rank}` : ""}
                </ActionStatus>
                <a
                  href="#submission"
                  className="text-center text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
                >
                  {deadlinePassed ? "View your submission ↓" : "Submit or update your entry ↓"}
                </a>
              </>
            ) : deadlinePassed ? (
              <ActionStatus tone="neutral">Entries are closed for this competition</ActionStatus>
            ) : (
              <>
                {Number(competition.fee) > 0 && currentUser && Number(currentUser.creditBalance) > 0 && (
                  <p className="text-sm text-green-700 dark:text-green-400">
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
          </ActionCard>
        }
      >
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

        {session && isEntered && (
          <section id="submission" className="mt-10 scroll-mt-32">
            <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Your submission</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <SubmissionForm
                slug={competition.slug}
                initialUrl={entry?.submissionUrl ?? ""}
                initialNotes={entry?.submissionNotes ?? ""}
                initialFileName={entry?.submissionFileName ?? null}
                initialIdCardFileName={currentUser?.idCardFileName ?? null}
                deadlinePassed={deadlinePassed}
              />
            </div>
          </section>
        )}
      </DetailColumns>
    </main>
  );
}
