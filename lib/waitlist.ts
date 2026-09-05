import { prisma } from "@/lib/prisma";
import { sendWaitlistSeatAvailableEmail } from "@/lib/email";
import { createNotification } from "@/lib/notify";
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
 * Called after a seat frees up (a cancellation or refund). Notifies the
 * oldest waitlist entry that a seat is open — first-come-first-served, no
 * hold placed on the seat, so it's still possible for someone else to grab
 * it first. An entry stays eligible (and gets re-notified on the next
 * opening) until the user actually registers — at which point the
 * registration path removes their row — or leaves the waitlist; notifiedAt
 * is just a "last notified" timestamp, not an exclusion filter, since
 * excluding already-notified entries would let one unresponsive user
 * permanently block everyone behind them.
 */
export async function notifyNextWaitlisted(eventId: string): Promise<void> {
  const next = await prisma.eventWaitlist.findFirst({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    include: { user: true, event: true },
  });
  if (!next) return;

  await prisma.eventWaitlist.update({
    where: { id: next.id },
    data: { notifiedAt: new Date() },
  });

  await sendWaitlistSeatAvailableEmail(
    next.user.email,
    next.user.name,
    next.event.title,
    `${SITE_URL}/events/${next.event.slug}`
  );

  await createNotification({
    userId: next.userId,
    type: "WAITLIST_SEAT",
    title: `A seat opened up for ${next.event.title}`,
    body: "Seats are first-come, first-served — register soon.",
    url: `/events/${next.event.slug}`,
  }).catch((err) => console.error("Failed to create waitlist notification:", err));
}
