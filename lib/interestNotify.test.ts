import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../test/prismaMock";
import { notifyInterestedStudents } from "@/lib/interestNotify";
import { sendNewContentMatchingInterestEmail } from "@/lib/email";

vi.mock("@/lib/email", () => ({
  sendNewContentMatchingInterestEmail: vi.fn().mockResolvedValue(true),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makeStudent(overrides: { email: string; fieldOfStudy: string | null }) {
  return { email: overrides.email, name: "Student", fieldOfStudy: overrides.fieldOfStudy };
}

describe("notifyInterestedStudents", () => {
  it("emails a student whose field of study matches the item's category", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      makeStudent({ email: "match@example.com", fieldOfStudy: "Data Science" }),
    ] as never);

    await notifyInterestedStudents("course", {
      slug: "intro-data-science",
      title: "Intro to Data Science",
      category: "Data Science",
    });

    expect(sendNewContentMatchingInterestEmail).toHaveBeenCalledWith(
      "match@example.com",
      "Student",
      "course",
      "Intro to Data Science",
      expect.stringContaining("/courses/intro-data-science")
    );
  });

  it("skips a student whose field of study doesn't match", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      makeStudent({ email: "nomatch@example.com", fieldOfStudy: "Mechanical Engineering" }),
    ] as never);

    await notifyInterestedStudents("course", {
      slug: "intro-data-science",
      title: "Intro to Data Science",
      category: "Data Science",
    });

    expect(sendNewContentMatchingInterestEmail).not.toHaveBeenCalled();
  });

  it("matches on title when there's no category (events/competitions)", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      makeStudent({ email: "match@example.com", fieldOfStudy: "Robotics" }),
    ] as never);

    await notifyInterestedStudents("event", {
      slug: "robotics-workshop",
      title: "Robotics Workshop 2026",
    });

    expect(sendNewContentMatchingInterestEmail).toHaveBeenCalledWith(
      "match@example.com",
      "Student",
      "event",
      "Robotics Workshop 2026",
      expect.stringContaining("/events/robotics-workshop")
    );
  });

  it("queries only marketing-opted-in students with a field of study set", async () => {
    prismaMock.user.findMany.mockResolvedValue([] as never);

    await notifyInterestedStudents("competition", { slug: "c1", title: "Coding Cup" });

    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: { role: "STUDENT", marketingOptIn: true, fieldOfStudy: { not: null } },
      select: { email: true, name: true, fieldOfStudy: true },
    });
  });
});
