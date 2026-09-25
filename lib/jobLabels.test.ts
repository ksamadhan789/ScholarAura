import { describe, expect, it } from "vitest";
import { closingSoonLabel, formatPostedAgo, isNewJob } from "@/lib/jobLabels";

const now = new Date("2026-09-25T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

describe("formatPostedAgo", () => {
  it("uses relative wording for the last month", () => {
    expect(formatPostedAgo(daysAgo(0), now)).toBe("Posted today");
    expect(formatPostedAgo(daysAgo(1), now)).toBe("Posted yesterday");
    expect(formatPostedAgo(daysAgo(6), now)).toBe("Posted 6 days ago");
    expect(formatPostedAgo(daysAgo(45), now)).toBe(`Posted ${daysAgo(45).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`);
  });
});

describe("isNewJob / closingSoonLabel", () => {
  it("flags jobs under 3 days old as new", () => {
    expect(isNewJob(daysAgo(2), now)).toBe(true);
    expect(isNewJob(daysAgo(4), now)).toBe(false);
  });

  it("only warns within a week of a future deadline", () => {
    expect(closingSoonLabel(daysAgo(-4.5), now)).toBe("Closes in 4 days");
    expect(closingSoonLabel(daysAgo(-0.5), now)).toBe("Closes today");
    expect(closingSoonLabel(daysAgo(-20), now)).toBeNull();
    expect(closingSoonLabel(daysAgo(1), now)).toBeNull();
    expect(closingSoonLabel(null, now)).toBeNull();
  });
});
