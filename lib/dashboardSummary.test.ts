import { describe, expect, it } from "vitest";
import {
  firstNameOf,
  formatLength,
  istGreeting,
  pickContinueLearning,
  summarizeCourseProgress,
} from "@/lib/dashboardSummary";

describe("istGreeting", () => {
  it("uses the hour in India, not UTC", () => {
    // 02:00 UTC is 07:30 IST
    expect(istGreeting(new Date("2026-09-25T02:00:00Z"))).toBe("Good morning");
    // 08:00 UTC is 13:30 IST
    expect(istGreeting(new Date("2026-09-25T08:00:00Z"))).toBe("Good afternoon");
    // 14:00 UTC is 19:30 IST
    expect(istGreeting(new Date("2026-09-25T14:00:00Z"))).toBe("Good evening");
    // 21:00 UTC is 02:30 IST
    expect(istGreeting(new Date("2026-09-25T21:00:00Z"))).toBe("Good evening");
  });
});

describe("firstNameOf", () => {
  it("takes the first word of a name", () => {
    expect(firstNameOf("  Priya Anil Sharma ")).toBe("Priya");
  });

  it("falls back to the email's local part", () => {
    expect(firstNameOf("rahul.k@example.com")).toBe("rahul.k");
    expect(firstNameOf("")).toBe("there");
  });
});

describe("summarizeCourseProgress", () => {
  const videos = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("points at the first unfinished lecture", () => {
    expect(summarizeCourseProgress(videos, new Set(["a"]))).toEqual({
      completed: 1,
      total: 3,
      percent: 33,
      isComplete: false,
      nextVideoId: "b",
      actionLabel: "Continue",
    });
  });

  it("labels untouched and finished courses", () => {
    expect(summarizeCourseProgress(videos, new Set()).actionLabel).toBe("Start");
    const done = summarizeCourseProgress(videos, new Set(["a", "b", "c"]));
    expect(done).toMatchObject({
      isComplete: true,
      percent: 100,
      nextVideoId: "a",
      actionLabel: "Review",
    });
  });

  it("handles a course with no lectures", () => {
    expect(summarizeCourseProgress([], new Set())).toMatchObject({
      total: 0,
      percent: 0,
      nextVideoId: null,
    });
  });
});

describe("pickContinueLearning", () => {
  const course = (id: string, completed: number, total: number) => ({
    id,
    progress: summarizeCourseProgress(
      Array.from({ length: total }, (_, i) => ({ id: `${id}${i}` })),
      new Set(Array.from({ length: completed }, (_, i) => `${id}${i}`)),
    ),
  });

  it("puts started courses first and skips finished or empty ones", () => {
    const picked = pickContinueLearning([
      course("new", 0, 4),
      course("done", 2, 2),
      course("mid", 1, 3),
      course("empty", 0, 0),
    ]);
    expect(picked.map((c) => c.id)).toEqual(["mid", "new"]);
  });

  it("respects the limit", () => {
    const many = ["a", "b", "c", "d"].map((id) => course(id, 1, 5));
    expect(pickContinueLearning(many, 2).map((c) => c.id)).toEqual(["a", "b"]);
  });
});

describe("formatLength", () => {
  it("formats minutes and hours", () => {
    expect(formatLength(4380)).toBe("1h 13m");
    expect(formatLength(900)).toBe("15 min");
    expect(formatLength(20)).toBe("1 min");
    expect(formatLength(7200)).toBe("2h 0m");
  });
});
