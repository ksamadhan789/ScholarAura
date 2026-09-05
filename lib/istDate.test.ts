import { describe, expect, it } from "vitest";
import { getIstYear, getIstMonthKey } from "@/lib/istDate";

describe("getIstYear", () => {
  it("returns the UTC year when it's already midday IST", () => {
    // 2026-06-15T12:00:00Z is 2026-06-15T17:30+05:30 — same year either way.
    expect(getIstYear(new Date("2026-06-15T12:00:00Z"))).toBe(2026);
  });

  it("rolls over to the next year before UTC midnight, since IST is 5:30 ahead", () => {
    // 2025-12-31T20:00:00Z is 2026-01-01T01:30+05:30 — already Jan 1 in India.
    expect(getIstYear(new Date("2025-12-31T20:00:00Z"))).toBe(2026);
  });

  it("stays on the old year just before the IST rollover", () => {
    // 2025-12-31T18:00:00Z is 2025-12-31T23:30+05:30 — still Dec 31 in India.
    expect(getIstYear(new Date("2025-12-31T18:00:00Z"))).toBe(2025);
  });
});

describe("getIstMonthKey", () => {
  it("buckets a UTC-late-January instant into February in IST", () => {
    // 2026-01-31T21:00:00Z is 2026-02-01T02:30+05:30.
    expect(getIstMonthKey(new Date("2026-01-31T21:00:00Z"))).toBe("2026-02");
  });

  it("buckets a mid-month instant into the same month regardless of timezone", () => {
    expect(getIstMonthKey(new Date("2026-06-15T12:00:00Z"))).toBe("2026-06");
  });
});
