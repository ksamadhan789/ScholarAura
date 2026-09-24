import { describe, expect, it } from "vitest";
import {
  buildGoogleCalendarUrl,
  buildIcs,
  buildOutlookCalendarUrl,
  toCalendarUtc,
  type CalendarEvent,
} from "@/lib/calendarLinks";

const event: CalendarEvent = {
  uid: "event-123",
  title: "ICETS 2026: AI, Data & You",
  start: new Date("2026-10-04T04:30:00Z"),
  end: new Date("2026-10-05T11:30:00Z"),
  details: "International conference; two days",
  location: "In person · Mumbai",
  url: "https://scholaraura.com/events/icets-2026",
};

describe("toCalendarUtc", () => {
  it("formats as basic UTC without millis", () => {
    expect(toCalendarUtc(new Date("2026-10-04T04:30:00.123Z"))).toBe("20261004T043000Z");
  });
});

describe("buildGoogleCalendarUrl", () => {
  it("pre-fills title, dates, details with the event link, and location", () => {
    const url = new URL(buildGoogleCalendarUrl(event));
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe(event.title);
    expect(url.searchParams.get("dates")).toBe("20261004T043000Z/20261005T113000Z");
    expect(url.searchParams.get("details")).toContain("https://scholaraura.com/events/icets-2026");
    expect(url.searchParams.get("location")).toBe("In person · Mumbai");
  });
});

describe("buildOutlookCalendarUrl", () => {
  it("uses ISO dates", () => {
    const url = new URL(buildOutlookCalendarUrl(event));
    expect(url.searchParams.get("startdt")).toBe("2026-10-04T04:30:00.000Z");
    expect(url.searchParams.get("subject")).toBe(event.title);
  });
});

describe("buildIcs", () => {
  const ics = buildIcs(event, new Date("2026-09-24T00:00:00Z"));

  it("is a valid single-event calendar with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("UID:event-123@scholaraura.com\r\n");
    expect(ics).toContain("DTSTART:20261004T043000Z\r\n");
    expect(ics).toContain("DTEND:20261005T113000Z\r\n");
    expect(ics.split("\r\n").join("")).not.toMatch(/\n/);
  });

  it("escapes commas, semicolons and newlines in text", () => {
    expect(ics).toContain("SUMMARY:ICETS 2026: AI\\, Data & You");
    expect(ics.replace(/\r\n /g, "")).toContain("DESCRIPTION:International conference\; two days\\n\\nhttps://");
  });

  it("folds long lines to at most 75 octets", () => {
    const long = buildIcs({ ...event, details: "x".repeat(300) });
    for (const line of long.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(long.replace(/\r\n /g, "")).toContain("x".repeat(300));
  });

  it("folds without splitting multi-byte characters", () => {
    const long = buildIcs({ ...event, location: "₹".repeat(60) });
    expect(long.replace(/\r\n /g, "")).toContain("₹".repeat(60));
  });
});
