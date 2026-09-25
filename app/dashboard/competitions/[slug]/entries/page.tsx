import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { RefundButton } from "@/components/RefundButton";
import { RankInput } from "./RankInput";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DASHBOARD_TABLE_HEAD_CLASS,
  DASHBOARD_TABLE_WRAPPER_CLASS,
  DASHBOARD_TH_CLASS,
  DASHBOARD_TR_CLASS,
  DashboardEmptyState,
  DashboardShell,
} from "@/components/dashboard/DashboardShell";
import { Download, FolderDown, IdCard, Link as LinkIcon, Paperclip, Users } from "lucide-react";

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

  const [entries, totalCount, entryFileCount] = await Promise.all([
    prisma.competitionEntry.findMany({
      where: { competitionId: competition.id },
      include: { user: { select: { name: true, email: true, idCardFileId: true } } },
      orderBy: [{ rank: "asc" }, { registeredAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.competitionEntry.count({ where: { competitionId: competition.id } }),
    prisma.competitionEntry.count({
      where: { competitionId: competition.id, submissionFileId: { not: null } },
    }),
  ]);

  return (
    <DashboardShell
      title="Entries"
      description={competition.title}
      backHref="/dashboard/competitions"
      backLabel="Competitions"
      actions={
        <>
          {entryFileCount > 0 && (
            <a
              href={`/api/admin/competitions/${competition.slug}/entries/bulk-zip`}
              className={DASHBOARD_SECONDARY_BUTTON_CLASS}
            >
              <FolderDown aria-hidden className="h-4 w-4" />
              Entry files (ZIP)
            </a>
          )}
          <a
            href={`/api/admin/competitions/${competition.slug}/entries/export`}
            className={DASHBOARD_SECONDARY_BUTTON_CLASS}
          >
            <Download aria-hidden className="h-4 w-4" />
            Export CSV
          </a>
        </>
      }
    >
      {entries.length === 0 ? (
        <DashboardEmptyState icon={Users} title="No one has entered this competition yet" />
      ) : (
        <div className={DASHBOARD_TABLE_WRAPPER_CLASS}>
          <table className="w-full text-left text-sm">
            <thead className={DASHBOARD_TABLE_HEAD_CLASS}>
              <tr>
                <th className={DASHBOARD_TH_CLASS}>Name</th>
                <th className={DASHBOARD_TH_CLASS}>Email</th>
                <th className={DASHBOARD_TH_CLASS}>Team</th>
                <th className={DASHBOARD_TH_CLASS}>Payment</th>
                <th className={DASHBOARD_TH_CLASS}>ID Card</th>
                <th className={DASHBOARD_TH_CLASS}>Submission</th>
                <th className={DASHBOARD_TH_CLASS}>Rank</th>
                <th className={DASHBOARD_TH_CLASS}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className={DASHBOARD_TR_CLASS}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {entry.user.name}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`mailto:${entry.user.email}`}
                      className="text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {entry.user.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {entry.teamName ?? "—"}
                    {entry.teammates && <p className="mt-1 text-xs">{entry.teammates}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[entry.status]}>{entry.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {entry.user.idCardFileId ? (
                      <a
                        href={`/api/admin/users/${entry.userId}/id-card`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline dark:text-brand-400"
                      >
                        <IdCard aria-hidden className="mr-1 inline h-4 w-4" />
                        View
                      </a>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {entry.submissionFileId && (
                        <a
                          href={`/api/admin/competitions/${competition.slug}/entries/${entry.id}/file`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 hover:underline dark:text-brand-400"
                        >
                          <Paperclip aria-hidden className="mr-1 inline h-4 w-4" />
                          {entry.submissionFileName}
                        </a>
                      )}
                      {entry.submissionUrl && (
                        <a
                          href={entry.submissionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 hover:underline dark:text-brand-400"
                        >
                          <LinkIcon aria-hidden className="mr-1 inline h-4 w-4" />
                          Link
                        </a>
                      )}
                      {!entry.submissionFileId && !entry.submissionUrl && (
                        <span className="text-slate-500 dark:text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RankInput entryId={entry.id} initialRank={entry.rank} />
                  </td>
                  <td className="px-4 py-3">
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

      <Pagination
        page={page}
        totalCount={totalCount}
        basePath={`/dashboard/competitions/${competition.slug}/entries`}
      />
    </DashboardShell>
  );
}
