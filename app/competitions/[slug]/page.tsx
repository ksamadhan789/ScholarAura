import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EntryButton } from "./EntryButton";
import { SubmissionForm } from "./SubmissionForm";

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

  const [entry, currentUser, rates, winners] = session
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

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      {!competition.isPublished && (
        <p className="mb-4 inline-block rounded bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-sm text-amber-800 dark:text-amber-300">
          Draft — not visible to the public yet
        </p>
      )}
      <h1 className="text-2xl font-semibold">{competition.title}</h1>
      {competition.shortDescription && (
        <p className="mt-1 text-base text-gray-600 dark:text-slate-400">
          {competition.shortDescription}
        </p>
      )}
      <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
        {formatDate(competition.startDate)} – {formatDate(competition.endDate)} · Submit by{" "}
        {formatDate(competition.submissionDeadline)}
      </p>
      <p className="mt-4 text-gray-700">{competition.description}</p>

      {(competition.registrationStartDate || competition.resultDate) && (
        <div className="mt-4 rounded border border-gray-200 dark:border-slate-700 p-4 text-sm">
          <p className="font-medium">Important dates</p>
          <div className="mt-2 flex flex-col gap-1 text-gray-600 dark:text-slate-400">
            {competition.registrationStartDate && (
              <p>Registration opens: {formatDate(competition.registrationStartDate)}</p>
            )}
            <p>Submission deadline: {formatDate(competition.submissionDeadline)}</p>
            {competition.resultDate && (
              <p>Result declaration: {formatDate(competition.resultDate)}</p>
            )}
          </div>
        </div>
      )}

      {competition.eligibility && (
        <p className="mt-4 text-sm text-gray-600 dark:text-slate-400">
          <span className="font-medium text-gray-900 dark:text-white">Who can participate: </span>
          {competition.eligibility}
        </p>
      )}

      {(competition.prizeFirst ||
        competition.prizeSecond ||
        competition.prizeThird ||
        competition.prizeDescription) && (
        <div className="mt-4 rounded bg-brand-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
          <p className="font-medium">🏆 Prizes</p>
          <div className="mt-1 flex flex-col gap-1">
            {competition.prizeFirst && <p>🥇 1st Prize: {competition.prizeFirst}</p>}
            {competition.prizeSecond && <p>🥈 2nd Prize: {competition.prizeSecond}</p>}
            {competition.prizeThird && <p>🥉 3rd Prize: {competition.prizeThird}</p>}
            {competition.prizeDescription && <p>{competition.prizeDescription}</p>}
          </div>
        </div>
      )}

      {winners.length > 0 && (
        <div className="mt-4 rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-200">🏆 Winners</p>
          <div className="mt-2 flex flex-col gap-2">
            {winners.map((winner) => (
              <div key={winner.id} className="flex items-center justify-between">
                <span>
                  {medalByRank[winner.rank as number] ?? "🏅"}{" "}
                  {winner.teamName ?? winner.user.name}
                </span>
                {winner.rank && prizeByRank[winner.rank] && (
                  <span className="text-gray-600 dark:text-slate-400">
                    {prizeByRank[winner.rank]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {competition.maxTeamSize > 1 && (
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
          Teams of up to {competition.maxTeamSize} allowed.
        </p>
      )}

      <p className="mt-4 text-lg font-semibold">
        {Number(competition.fee) === 0 ? "Free" : `₹${competition.fee}`}
      </p>

      <div className="mt-6">
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
              You&apos;re entered in this competition
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
    </main>
  );
}
