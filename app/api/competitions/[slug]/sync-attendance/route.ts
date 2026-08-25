import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSheetRows } from "@/lib/google/sheetsService";
import { computeCompetitionEligibility } from "@/lib/eligibility";

const importSchema = z.object({
  rows: z.array(
    z.object({
      email: z.string().trim().email(),
      attendancePercent: z.coerce.number().int().min(0).max(100),
    })
  ),
});

/**
 * Applies a set of {email, attendancePercent} rows against a competition's
 * entries, recomputing certificate eligibility for each match. Shared by
 * both the Sheets-pull and CSV-import paths below. Mirrors events'
 * sync-attendance route — see that file for the reasoning behind each piece.
 */
async function applyAttendanceRows(
  competitionId: string,
  competition: { attendanceRequired: boolean; minAttendancePercent: number | null },
  rows: { email: string; attendancePercent: number }[]
) {
  let matched = 0;
  let unmatched = 0;

  for (const row of rows) {
    const entry = await prisma.competitionEntry.findFirst({
      where: { competitionId, user: { email: { equals: row.email, mode: "insensitive" } } },
    });
    if (!entry) {
      unmatched++;
      continue;
    }

    const eligibleForCertificate = computeCompetitionEligibility(
      { status: entry.status, attendancePercent: row.attendancePercent },
      competition
    );

    await prisma.competitionEntry.update({
      where: { id: entry.id },
      data: {
        attendancePercent: row.attendancePercent,
        attendanceVerifiedAt: new Date(),
        eligibleForCertificate,
      },
    });
    matched++;
  }

  return { matched, unmatched };
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  if (body?.rows) {
    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const result = await applyAttendanceRows(competition.id, competition, parsed.data.rows);
    return NextResponse.json(result);
  }

  if (!competition.googleSheetId) {
    return NextResponse.json(
      { error: "No Google Sheet is configured for this competition" },
      { status: 400 }
    );
  }

  let sheetRows;
  try {
    sheetRows = await getSheetRows(competition.googleSheetId);
  } catch (err) {
    console.error("Attendance sheet sync failed:", err);
    return NextResponse.json(
      { error: "Couldn't read the Google Sheet. Check it's shared with the service account." },
      { status: 502 }
    );
  }

  function firstNonEmpty(row: Record<string, string>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== "") return value;
    }
    return undefined;
  }

  let skipped = 0;
  const rows = sheetRows
    .map((row) => {
      const raw = firstNonEmpty(row, ["attendance", "attendance %", "attendance%"]);
      return {
        email: row["email"] ?? "",
        attendancePercent: raw !== undefined ? Number(raw) : NaN,
      };
    })
    .filter((row) => {
      const valid =
        row.email && Number.isFinite(row.attendancePercent) && row.attendancePercent >= 0 && row.attendancePercent <= 100;
      if (!valid) skipped++;
      return valid;
    });

  const result = await applyAttendanceRows(competition.id, competition, rows);
  return NextResponse.json({ ...result, skipped });
}
