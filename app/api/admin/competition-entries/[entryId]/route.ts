import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCompetitionResultEmail } from "@/lib/email";
import { createNotification } from "@/lib/notify";
import { SITE_URL } from "@/lib/siteUrl";

const updateEntrySchema = z.object({
  rank: z.number().int().min(1).nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { entryId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const existing = await prisma.competitionEntry.findUnique({
    where: { id: params.entryId },
    include: { user: true, competition: { select: { title: true, slug: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const entry = await prisma.competitionEntry.update({
    where: { id: params.entryId },
    data: { rank: parsed.data.rank },
  });

  // Only announce on the null → set transition — re-editing an already
  // announced rank (e.g. fixing a typo) shouldn't re-notify the entrant.
  if (existing.rank == null && entry.rank != null) {
    const competitionUrl = `${SITE_URL}/competitions/${existing.competition.slug}`;
    await sendCompetitionResultEmail(
      existing.user.email,
      existing.user.name,
      existing.competition.title,
      entry.rank,
      competitionUrl
    ).catch((err) => console.error("Failed to send competition result email:", err));
    await createNotification({
      userId: existing.userId,
      type: "COMPETITION_RESULT",
      title: `Results are in for ${existing.competition.title}`,
      url: `/competitions/${existing.competition.slug}`,
    }).catch((err) => console.error("Failed to create competition result notification:", err));
  }

  return NextResponse.json(entry);
}
