import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCompetitionResultEmail } from "@/lib/email";
import { createNotification } from "@/lib/notify";
import { SITE_URL } from "@/lib/siteUrl";

const selectionsSchema = z.object({
  selections: z.array(
    z.object({ rank: z.number().int().min(1).max(3), entryId: z.string().nullable() })
  ),
});

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = selectionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const entryIds = parsed.data.selections
    .map((s) => s.entryId)
    .filter((id): id is string => id !== null);
  if (new Set(entryIds).size !== entryIds.length) {
    return NextResponse.json({ error: "The same entry can't hold two ranks" }, { status: 400 });
  }

  // Every selected entry must actually belong to this competition — without
  // this, an entryId typo or copy-paste from another competition's export
  // would silently rank (and email a "you won" notice to) an unrelated entry.
  if (entryIds.length > 0) {
    const ownedCount = await prisma.competitionEntry.count({
      where: { id: { in: entryIds }, competitionId: competition.id },
    });
    if (ownedCount !== entryIds.length) {
      return NextResponse.json(
        { error: "One or more selected entries don't belong to this competition" },
        { status: 400 }
      );
    }
  }

  // Snapshot who already held a rank so the notification below only fires
  // for entries newly awarded one by this save, not everyone re-selected.
  const previouslyRanked = new Set(
    (
      await prisma.competitionEntry.findMany({
        where: { competitionId: competition.id, rank: { not: null } },
        select: { id: true },
      })
    ).map((e) => e.id)
  );

  await prisma.$transaction(async (tx) => {
    await tx.competitionEntry.updateMany({
      where: { competitionId: competition.id, rank: { not: null } },
      data: { rank: null },
    });
    for (const s of parsed.data.selections) {
      if (s.entryId) {
        await tx.competitionEntry.update({ where: { id: s.entryId }, data: { rank: s.rank } });
      }
    }
  });

  const newlyRanked = parsed.data.selections.filter(
    (s) => s.entryId && !previouslyRanked.has(s.entryId)
  );
  if (newlyRanked.length > 0) {
    const winners = await prisma.competitionEntry.findMany({
      where: { id: { in: newlyRanked.map((s) => s.entryId as string) } },
      include: { user: true },
    });
    const rankByEntryId = new Map(newlyRanked.map((s) => [s.entryId, s.rank]));
    const competitionUrl = `${SITE_URL}/competitions/${competition.slug}`;

    await Promise.all(
      winners.map(async (entry) => {
        const rank = rankByEntryId.get(entry.id)!;
        await sendCompetitionResultEmail(
          entry.user.email,
          entry.user.name,
          competition.title,
          rank,
          competitionUrl
        ).catch((err) => console.error("Failed to send competition result email:", err));
        await createNotification({
          userId: entry.userId,
          type: "COMPETITION_RESULT",
          title: `Results are in for ${competition.title}`,
          url: `/competitions/${competition.slug}`,
        }).catch((err) => console.error("Failed to create competition result notification:", err));
      })
    );
  }

  return NextResponse.json({ ok: true });
}
