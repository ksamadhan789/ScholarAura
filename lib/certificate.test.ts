import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../test/prismaMock";
import { issueCourseCertificateIfEligible } from "@/lib/certificate";

vi.mock("@/lib/email", () => ({
  sendCertificateReadyEmail: vi.fn().mockResolvedValue(true),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Baseline: no certificate yet, all lectures watched — the two checks
  // that already existed before quiz gating was added.
  prismaMock.certificate.findUnique.mockResolvedValue(null);
  prismaMock.courseVideo.count.mockResolvedValue(2);
  prismaMock.courseProgress.count.mockResolvedValue(2);
});

describe("issueCourseCertificateIfEligible — quiz gating", () => {
  it("withholds the certificate when a quiz exists but has no passing attempt", async () => {
    prismaMock.quiz.findMany.mockResolvedValue([{ id: "quiz-1" }] as never);
    prismaMock.quizAttempt.findMany.mockResolvedValue([]);

    const result = await issueCourseCertificateIfEligible("user-1", "course-1");

    expect(result).toBeNull();
    expect(prismaMock.certificate.create).not.toHaveBeenCalled();
  });

  it("withholds the certificate when only some of several quizzes have been passed", async () => {
    prismaMock.quiz.findMany.mockResolvedValue([{ id: "quiz-1" }, { id: "quiz-2" }] as never);
    prismaMock.quizAttempt.findMany.mockResolvedValue([{ quizId: "quiz-1" }] as never);

    const result = await issueCourseCertificateIfEligible("user-1", "course-1");

    expect(result).toBeNull();
  });

  it("issues the certificate once every quiz has a passing attempt", async () => {
    prismaMock.quiz.findMany.mockResolvedValue([{ id: "quiz-1" }, { id: "quiz-2" }] as never);
    prismaMock.quizAttempt.findMany.mockResolvedValue([
      { quizId: "quiz-1" },
      { quizId: "quiz-2" },
    ] as never);
    prismaMock.certificate.count.mockResolvedValue(0);
    prismaMock.certificate.create.mockResolvedValue({ id: "cert-1" } as never);

    const result = await issueCourseCertificateIfEligible("user-1", "course-1");

    expect(prismaMock.certificate.create).toHaveBeenCalled();
    expect(result).toEqual({ id: "cert-1" });
  });

  it("is unaffected when the course has no quizzes at all", async () => {
    prismaMock.quiz.findMany.mockResolvedValue([]);
    prismaMock.certificate.count.mockResolvedValue(0);
    prismaMock.certificate.create.mockResolvedValue({ id: "cert-1" } as never);

    const result = await issueCourseCertificateIfEligible("user-1", "course-1");

    expect(prismaMock.quizAttempt.findMany).not.toHaveBeenCalled();
    expect(prismaMock.certificate.create).toHaveBeenCalled();
    expect(result).toEqual({ id: "cert-1" });
  });
});
