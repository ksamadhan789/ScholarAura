import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WinnerPicker } from "./WinnerPicker";

export default async function CompetitionWinnersPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition) {
    notFound();
  }

  const entries = await prisma.competitionEntry.findMany({
    where: { competitionId: competition.id, status: "SUCCESS" },
    include: { user: { select: { name: true } } },
    orderBy: { registeredAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Link
        href="/dashboard/competitions"
        className="text-sm text-gray-500 hover:underline dark:text-slate-400"
      >
        ← Manage competitions
      </Link>
      <h1 className="mt-2 mb-2 text-2xl font-semibold">{competition.title} — Winners</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
        Pick the 1st, 2nd, and 3rd place entries. This publishes immediately on the public
        competition page.
      </p>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">
          No paid/confirmed entries yet — nothing to award.
        </p>
      ) : (
        <WinnerPicker
          entries={entries.map((e) => ({
            id: e.id,
            label: e.teamName ?? e.user.name,
            rank: e.rank,
          }))}
        />
      )}
    </main>
  );
}
