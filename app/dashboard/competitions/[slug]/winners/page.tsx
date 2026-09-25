import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WinnerPicker } from "./WinnerPicker";
import { DashboardEmptyState, DashboardShell } from "@/components/dashboard/DashboardShell";
import { Trophy } from "lucide-react";

export default async function CompetitionWinnersPage({ params }: { params: { slug: string } }) {
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
    <DashboardShell
      narrow
      title="Winners"
      description={`${competition.title} — pick the 1st, 2nd and 3rd place entries. This publishes immediately on the public competition page.`}
      backHref="/dashboard/competitions"
      backLabel="Competitions"
    >
      {entries.length === 0 ? (
        <DashboardEmptyState
          icon={Trophy}
          title="No confirmed entries yet"
          text="Nothing to award until someone has entered."
        />
      ) : (
        <WinnerPicker
          slug={competition.slug}
          entries={entries.map((e) => ({
            id: e.id,
            label: e.teamName ?? e.user.name,
            rank: e.rank,
          }))}
        />
      )}
    </DashboardShell>
  );
}
