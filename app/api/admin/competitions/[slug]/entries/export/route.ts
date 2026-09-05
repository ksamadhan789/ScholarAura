import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsvResponse } from "@/lib/csv";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  const entries = await prisma.competitionEntry.findMany({
    where: { competitionId: competition.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ rank: "asc" }, { registeredAt: "desc" }],
  });

  const header = ["Name", "Email", "Team", "Payment status", "Submission", "Rank"];
  const rows = entries.map((entry) => [
    entry.user.name,
    entry.user.email,
    entry.teamName ?? "",
    entry.status,
    entry.submissionUrl ?? "",
    entry.rank != null ? String(entry.rank) : "",
  ]);

  return toCsvResponse(header, rows, `${competition.slug}-entries-${new Date().toISOString().slice(0, 10)}.csv`);
}
