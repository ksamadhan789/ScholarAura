import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEventReminderEmail, sendCompetitionReminderEmail } from "@/lib/email";
import { secretsMatch } from "@/lib/timingSafeEqual";
import { sendDueJobAlerts } from "@/lib/jobAlerts";
import { deleteStaleStagedBlobs } from "@/lib/blobUpload";

// Runs once a day (see vercel.json). A generous look-ahead window plus the
// reminderSentAt guard means a registration gets exactly one reminder even
// though the window re-covers events/deadlines already checked on a prior run.
const LOOKAHEAD_HOURS = 48;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");
  if (!secret || !provided) return false;
  return secretsMatch(provided, `Bearer ${secret}`);
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

  // Daily job-alert emails ride along on this existing daily cron rather than
  // a cron of their own. Isolated so an alert failure can't hide the
  // reminder counts above (which have already been sent and recorded).
  let jobAlertEmailsSent = 0;
  try {
    jobAlertEmailsSent = (await sendDueJobAlerts(now)).emailsSent;
  } catch (err) {
    console.error("Sending job alerts failed:", err);
  }

  // Also daily housekeeping: staged uploads nobody confirmed (see lib/blobUpload.ts).
  let staleUploadsDeleted = 0;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      staleUploadsDeleted = await deleteStaleStagedBlobs(now);
    } catch (err) {
      console.error("Deleting stale staged uploads failed:", err);
    }
  }

  return NextResponse.json({ eventRemindersSent, competitionRemindersSent, jobAlertEmailsSent, staleUploadsDeleted });
}
