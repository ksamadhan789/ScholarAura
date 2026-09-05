import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../test/prismaMock";
import { joinEventWaitlist, leaveEventWaitlist, notifyNextWaitlisted, NotFullError } from "@/lib/waitlist";

vi.mock("@/lib/email", () => ({
  sendWaitlistSeatAvailableEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/notify", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

import { sendWaitlistSeatAvailableEmail } from "@/lib/email";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("notifyNextWaitlisted", () => {
  const entry = {
    id: "wl-1",
    userId: "user-1",
    eventId: "event-1",
    notifiedAt: null,
    user: { email: "user@example.com", name: "User" },
    event: { title: "Test Event", slug: "test-event" },
  };

  it("notifies the oldest waitlisted entry", async () => {
    prismaMock.eventWaitlist.findFirst.mockResolvedValue(entry as never);
    prismaMock.eventWaitlist.update.mockResolvedValue(entry as never);

    await notifyNextWaitlisted("event-1");

    expect(prismaMock.eventWaitlist.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { eventId: "event-1" } })
    );
    expect(sendWaitlistSeatAvailableEmail).toHaveBeenCalledWith(
      "user@example.com",
      "User",
      "Test Event",
      expect.stringContaining("/events/test-event")
    );
  });

  it("re-notifies an entry that was already notified once, instead of skipping it forever", async () => {
    const alreadyNotified = { ...entry, notifiedAt: new Date("2026-01-01") };
    prismaMock.eventWaitlist.findFirst.mockResolvedValue(alreadyNotified as never);
    prismaMock.eventWaitlist.update.mockResolvedValue(alreadyNotified as never);

    await notifyNextWaitlisted("event-1");

    // The query no longer excludes previously-notified entries — otherwise a
    // user who didn't grab the first seat that opened up would be
    // permanently skipped on every later opening.
    expect(prismaMock.eventWaitlist.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { eventId: "event-1" } })
    );
    expect(sendWaitlistSeatAvailableEmail).toHaveBeenCalled();
  });

  it("does nothing when nobody is waiting", async () => {
    prismaMock.eventWaitlist.findFirst.mockResolvedValue(null);

    await notifyNextWaitlisted("event-1");

    expect(prismaMock.eventWaitlist.update).not.toHaveBeenCalled();
    expect(sendWaitlistSeatAvailableEmail).not.toHaveBeenCalled();
  });
});

describe("leaveEventWaitlist", () => {
  it("removes the user's waitlist entry for the event", async () => {
    prismaMock.eventWaitlist.deleteMany.mockResolvedValue({ count: 1 });

    await leaveEventWaitlist("user-1", "event-1");

    expect(prismaMock.eventWaitlist.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", eventId: "event-1" },
    });
  });
});

describe("joinEventWaitlist", () => {
  it("throws NotFullError when the event still has open seats", async () => {
    prismaMock.event.findUniqueOrThrow.mockResolvedValue({ seatsFilled: 3, seatsTotal: 10 } as never);

    await expect(joinEventWaitlist("user-1", "event-1")).rejects.toThrow(NotFullError);
  });
});
