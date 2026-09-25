import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { Award, Pencil, Plus, Trophy, Users } from "lucide-react";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_PRIMARY_BUTTON_CLASS,
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DashboardEmptyState,
  DashboardShell,
  DashboardTabs,
  DateTile,
} from "@/components/dashboard/DashboardShell";
import { CompetitionPublishToggle } from "./CompetitionPublishToggle";
import { CompetitionArchiveToggle } from "./CompetitionArchiveToggle";

export default async function ManageCompetitionsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const showArchived = searchParams.tab === "archived";

  const [competitions, activeCount, archivedCount] = await Promise.all([
    prisma.competition.findMany({
      where: { isArchived: showArchived },
      orderBy: { startDate: "asc" },
      include: { _count: { select: { entries: { where: { status: "SUCCESS" } } } } },
    }),
    prisma.competition.count({ where: { isArchived: false } }),
    prisma.competition.count({ where: { isArchived: true } }),
  ]);

  const now = new Date();

  return (
    <DashboardShell
      title="Manage competitions"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description="Soonest deadline first. Entry counts include completed entries only."
      actions={
        <Link href="/dashboard/competitions/new" className={`${DASHBOARD_PRIMARY_BUTTON_CLASS} py-1.5`}>
          <Plus aria-hidden className="h-4 w-4" />
          New competition
        </Link>
      }
    >
      <DashboardTabs
        active={showArchived ? "archived" : "active"}
        tabs={[
          { key: "active", label: "Active", count: activeCount, href: "/dashboard/competitions" },
          { key: "archived", label: "Archived", count: archivedCount, href: "/dashboard/competitions?tab=archived" },
        ]}
      />

      {competitions.length === 0 ? (
        <DashboardEmptyState
          icon={Trophy}
          title={showArchived ? "No archived competitions" : "No competitions created yet"}
          href={showArchived ? undefined : "/dashboard/competitions/new"}
          cta={showArchived ? undefined : "Create a competition"}
        />
      ) : (
        <ul className="space-y-4">
          {competitions.map((c) => {
            const closed = c.submissionDeadline < now;
            return (
              <li key={c.id} className={`${DASHBOARD_CARD_CLASS} p-5`}>
                <div className="flex gap-4">
                  <DateTile date={c.submissionDeadline} muted={closed} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={c.isPublished ? "success" : "warning"}>
                        {c.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {closed && <Badge variant="neutral">Submissions closed</Badge>}
                    </div>
                    <Link
                      href={`/competitions/${c.slug}`}
                      className="mt-1.5 block font-semibold leading-snug text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                    >
                      {c.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Submit by{" "}
                      {c.submissionDeadline.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "Asia/Kolkata",
                      })}{" "}
                      · {c._count.entries} {c._count.entries === 1 ? "entry" : "entries"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                  <Link href={`/dashboard/competitions/${c.slug}/edit`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
                    <Pencil aria-hidden className="h-4 w-4" />
                    Edit
                  </Link>
                  <Link href={`/dashboard/competitions/${c.slug}/entries`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
                    <Users aria-hidden className="h-4 w-4" />
                    Entries
                  </Link>
                  <Link href={`/dashboard/competitions/${c.slug}/winners`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
                    <Trophy aria-hidden className="h-4 w-4 text-amber-500" />
                    Winners
                  </Link>
                  <Link
                    href={`/dashboard/competitions/${c.slug}/certificates`}
                    className={DASHBOARD_SECONDARY_BUTTON_CLASS}
                  >
                    <Award aria-hidden className="h-4 w-4" />
                    Certificates
                  </Link>
                  <span className="ml-auto flex flex-wrap gap-1">
                    <CompetitionPublishToggle slug={c.slug} isPublished={c.isPublished} />
                    <CompetitionArchiveToggle slug={c.slug} isArchived={c.isArchived} />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
}
