import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const entry = await prisma.competitionEntry.update({
    where: { id: params.entryId },
    data: { rank: parsed.data.rank },
  });

  return NextResponse.json(entry);
}
