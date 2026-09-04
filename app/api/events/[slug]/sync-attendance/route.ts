import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSheetRows } from "@/lib/google/sheetsService";
import { computeEligibility } from "@/lib/eligibility";

const importSchema = z.object({
  rows: z.array(
    z.object({
      email: z.string().trim().email(),
      attendancePercent: z.coerce.number().int().min(0).max(100),
    })
  ),
});

/**
 * Applies a set of {email, attendancePercent} rows against an event's
 * registrations, recomputing certificate eligibility for each match. Shared
 * by both the Sheets-pull and CSV-import paths below.
 */
async function applyAttendanceRows(
  eventId: string,
  event: { attendanceRequired: boolean; minAttendancePercent: number | null },
  rows: { email: string; attendancePercent: number }[]
) {
  if (rows.length === 0) return { matched: 0, unmatched: 0 };

  // One query to resolve every row against its registration, instead of a
  // findFirst per row — matters once an event has a few hundred attendees.
  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId },
    include: { user: { select: { email: true } } },
  });
  const byEmail = new Map(registrations.map((r) => [r.user.email.toLowerCase(), r]));

  let matched = 0;
  let unmatched = 0;
  const updates: ReturnType<typeof prisma.eventRegistration.update>[] = [];

  for (const row of rows) {
    const registration = byEmail.get(row.email.toLowerCase());
    if (!registration) {
      unmatched++;
      continue;
    }
    matched++;

    const eligibleForCertificate = computeEligibility(
      { status: registration.status, attendancePercent: row.attendancePercent },
      event
    );

    updates.push(
      prisma.eventRegistration.update({
        where: { id: registration.id },
        data: {
          attendancePercent: row.attendancePercent,
          attendanceVerifiedAt: new Date(),
          eligibleForCertificate,
        },
      })
    );
  }

  // Concurrent rather than one giant transaction — a single bad row
  // shouldn't be able to roll back every other already-applied update.
  await Promise.all(updates);

  return { matched, unmatched };
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  // Manual/CSV import: caller supplies rows directly.
  if (body?.rows) {
    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const result = await applyAttendanceRows(event.id, event, parsed.data.rows);
    return NextResponse.json(result);
  }

  // Otherwise pull from the event's configured Google Sheet.
  if (!event.googleSheetId) {
    return NextResponse.json(
      { error: "No Google Sheet is configured for this event" },
      { status: 400 }
    );
  }

  let sheetRows;
  try {
    sheetRows = await getSheetRows(event.googleSheetId);
  } catch (err) {
    console.error("Attendance sheet sync failed:", err);
    return NextResponse.json(
      { error: "Couldn't read the Google Sheet. Check it's shared with the service account." },
      { status: 502 }
    );
  }

  // Returns the first candidate column that's actually present with a
  // non-empty value — a `??` chain would stop at the first key that merely
  // *exists* (even blank), missing real data in a later fallback column.
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
      // A missing/blank cell must NOT become 0% — Number("") is 0 in JS, which
      // would silently record "no data" as "failed attendance."
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

  const result = await applyAttendanceRows(event.id, event, rows);
  return NextResponse.json({ ...result, skipped });
}
