import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { RefundButton } from "@/components/RefundButton";
import { RankInput } from "./RankInput";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";

const STATUS_VARIANT = {
  SUCCESS: "success",
  PENDING: "warning",
  FAILED: "neutral",
  REFUNDED: "neutral",
} as const;

export default async function CompetitionEntriesPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
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

  const page = Math.max(1, Number(searchParams.page) || 1);

  const [entries, totalCount] = await Promise.all([
    prisma.competitionEntry.findMany({
      where: { competitionId: competition.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ rank: "asc" }, { registeredAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.competitionEntry.count({ where: { competitionId: competition.id } }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <Link
        href="/dashboard/competitions"
        className="text-sm text-gray-500 hover:underline dark:text-slate-400"
      >
        ← Manage competitions
      </Link>
      <div className="mt-2 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{competition.title} — Entries</h1>
        <a
          href={`/api/admin/competitions/${competition.slug}/entries/export`}
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Export CSV
        </a>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">
          No one has entered this competition yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Team</th>
                <th className="px-4 py-2.5 font-medium">Payment</th>
                <th className="px-4 py-2.5 font-medium">Submission</th>
                <th className="px-4 py-2.5 font-medium">Rank</th>
                <th className="px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-gray-200 dark:border-slate-700">
                  <td className="px-4 py-2.5">{entry.user.name}</td>
                  <td className="px-4 py-2.5">
                    <a href={`mailto:${entry.user.email}`} className="underline">
                      {entry.user.email}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                    {entry.teamName ?? "—"}
                    {entry.teammates && <p className="mt-1 text-xs">{entry.teammates}</p>}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={STATUS_VARIANT[entry.status]}>{entry.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    {entry.submissionUrl ? (
                      <a
                        href={entry.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-500 dark:text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <RankInput entryId={entry.id} initialRank={entry.rank} />
                  </td>
                  <td className="px-4 py-2.5">
                    {entry.status === "SUCCESS" && (
                      <RefundButton refundUrl={`/api/admin/competition-entries/${entry.id}/refund`} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalCount={totalCount} basePath={`/dashboard/competitions/${competition.slug}/entries`} />
    </main>
  );
}
