import { prisma } from "@/lib/prisma";
import { sendWaitlistSeatAvailableEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/siteUrl";

export class NotFullError extends Error {
  constructor() {
    super("EVENT_NOT_FULL");
  }
}
export class AlreadyRegisteredError extends Error {
  constructor() {
    super("ALREADY_REGISTERED");
  }
}

export async function joinEventWaitlist(userId: string, eventId: string) {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
  if (event.seatsFilled < event.seatsTotal) {
    throw new NotFullError();
  }

  const existingRegistration = await prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  if (existingRegistration?.status === "CONFIRMED") {
    throw new AlreadyRegisteredError();
  }

  return prisma.eventWaitlist.upsert({
    where: { userId_eventId: { userId, eventId } },
    update: {},
    create: { userId, eventId },
  });
}

export async function leaveEventWaitlist(userId: string, eventId: string) {
  await prisma.eventWaitlist.deleteMany({ where: { userId, eventId } });
}

/**
 * Called after a seat frees up (currently only from a confirmed
 * registration's refund). Notifies the oldest not-yet-notified waitlist
 * entry that a seat is open — first-come-first-served, no hold placed on
 * the seat, so it's still possible for someone else to grab it first.
 */
export async function notifyNextWaitlisted(eventId: string): Promise<void> {
  const next = await prisma.eventWaitlist.findFirst({
    where: { eventId, notifiedAt: null },
    orderBy: { createdAt: "asc" },
    include: { user: true, event: true },
  });
  if (!next) return;

  const claimed = await prisma.eventWaitlist.updateMany({
    where: { id: next.id, notifiedAt: null },
    data: { notifiedAt: new Date() },
  });
  if (claimed.count === 0) return;

  await sendWaitlistSeatAvailableEmail(
    next.user.email,
    next.user.name,
    next.event.title,
    `${SITE_URL}/events/${next.event.slug}`
  );
}
