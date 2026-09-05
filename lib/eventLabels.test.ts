import { describe, expect, it } from "vitest";
import { formatDateRange, formatDateTime } from "@/lib/eventLabels";

describe("formatDateTime", () => {
  it("renders the time in IST, not the server's local timezone", () => {
    // 04:30:00Z is exactly 10:00 am IST — this was previously rendered
    // straight in UTC (e.g. "04:30 am") on a UTC-local server.
    const result = formatDateTime(new Date("2026-03-15T04:30:00Z"));
    expect(result).toContain("10:00");
    expect(result).not.toContain("04:30");
  });
});

describe("formatDateRange", () => {
  it("renders start/end times in IST for a same-IST-day event", () => {
    // 04:30Z–07:30Z is 10:00am–1:00pm IST, same calendar day in India.
    const result = formatDateRange(new Date("2026-03-15T04:30:00Z"), new Date("2026-03-15T07:30:00Z"));
    expect(result).toContain("10:00");
    expect(result).toContain("1:00");
  });

  it("treats start/end as the same day based on the IST calendar day, not UTC", () => {
    // start = 2026-03-15T20:00:00Z = 2026-03-16T01:30 IST
    // end   = 2026-03-16T02:00:00Z = 2026-03-16T07:30 IST
    // Different UTC calendar dates, but the same IST calendar day — under
    // the old UTC-based check this would render as a date-to-date range
    // ("15 Mar – 16 Mar") instead of the correct same-day time range.
    const result = formatDateRange(new Date("2026-03-15T20:00:00Z"), new Date("2026-03-16T02:00:00Z"));
    expect(result).toContain("16 Mar 2026,");
    expect(result).not.toContain("15 Mar");
  });
});
