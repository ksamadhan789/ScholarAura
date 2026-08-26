import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEventReminderEmail, sendCompetitionReminderEmail } from "@/lib/email";

// Runs once a day (see vercel.json). A generous look-ahead window plus the
// reminderSentAt guard means a registration gets exactly one reminder even
// though the window re-covers events/deadlines already checked on a prior run.
const LOOKAHEAD_HOURS = 48;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + LOOKAHEAD_HOURS * 60 * 60 * 1000);

  const registrations = await prisma.eventRegistration.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      event: { startDate: { gt: now, lte: windowEnd } },
    },
    include: { user: true, event: true },
  });

  let eventRemindersSent = 0;
  for (const registration of registrations) {
    const ok = await sendEventReminderEmail(
      registration.user.email,
      registration.user.name,
      registration.event.title,
      registration.event.startDate,
      registration.event.venueOrLink
    );
    if (ok) {
      // Guarded so a concurrent run of this same cron can't double-send.
      const claimed = await prisma.eventRegistration.updateMany({
        where: { id: registration.id, reminderSentAt: null },
        data: { reminderSentAt: new Date() },
      });
      if (claimed.count > 0) eventRemindersSent++;
    }
  }

  const entries = await prisma.competitionEntry.findMany({
    where: {
      status: "SUCCESS",
      reminderSentAt: null,
      competition: { submissionDeadline: { gt: now, lte: windowEnd } },
    },
    include: { user: true, competition: true },
  });

  let competitionRemindersSent = 0;
  for (const entry of entries) {
    const ok = await sendCompetitionReminderEmail(
      entry.user.email,
      entry.user.name,
      entry.competition.title,
      entry.competition.submissionDeadline
    );
    if (ok) {
      const claimed = await prisma.competitionEntry.updateMany({
        where: { id: entry.id, reminderSentAt: null },
        data: { reminderSentAt: new Date() },
      });
      if (claimed.count > 0) competitionRemindersSent++;
    }
  }

  return NextResponse.json({ eventRemindersSent, competitionRemindersSent });
}
