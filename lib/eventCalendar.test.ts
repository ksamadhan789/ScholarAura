import { describe, expect, it } from "vitest";
import { eventCalendarEmailLinks, eventToCalendar } from "@/lib/eventCalendar";

const event = {
  id: "e1",
  slug: "icets",
  title: "ICETS",
  shortDescription: "Two-day conference",
  startDate: new Date("2026-10-04T04:30:00Z"),
  endDate: new Date("2026-10-05T11:30:00Z"),
  format: "OFFLINE",
  city: "Mumbai",
  venueOrLink: "Hall 3, IIT Bombay",
};

describe("eventToCalendar", () => {
  it("keeps the venue private on public links", () => {
    const cal = eventToCalendar(event, "https://scholaraura.com");
    expect(cal.location).toBe("In person · Mumbai");
    expect(cal.details).not.toContain("IIT Bombay");
    expect(cal.url).toBe("https://scholaraura.com/events/icets");
    expect(cal.uid).toBe("event-e1");
  });

  it("shows online events as Online", () => {
    expect(eventToCalendar({ ...event, format: "ONLINE", city: null }, "https://x.com").location).toBe("Online");
  });

  it("includes the real venue for registered people", () => {
    const cal = eventToCalendar(event, "https://x.com", { includeVenue: true });
    expect(cal.location).toBe("Hall 3, IIT Bombay");
    expect(cal.details).toContain("Venue / link: Hall 3, IIT Bombay");
  });
});

describe("eventCalendarEmailLinks", () => {
  it("builds Google/Outlook links with the venue and the public .ics link", () => {
    const links = eventCalendarEmailLinks(event, "https://scholaraura.com")!;
    expect(new URL(links.googleUrl).searchParams.get("location")).toBe("Hall 3, IIT Bombay");
    expect(links.icsUrl).toBe("https://scholaraura.com/api/events/icets/calendar");
  });

  it("returns undefined instead of throwing on incomplete data", () => {
    const broken = { ...event, endDate: undefined } as unknown as typeof event;
    expect(eventCalendarEmailLinks(broken, "https://x.com")).toBeUndefined();
  });
});
