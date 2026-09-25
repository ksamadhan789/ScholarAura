import { describe, expect, it } from "vitest";
import { buildQuizReview, gradeQuiz, type QuizQuestion } from "@/lib/quiz";

const questions: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "2 + 2?",
    allowMultiple: false,
    options: [
      { id: "a", text: "3", isCorrect: false },
      { id: "b", text: "4", isCorrect: true },
    ],
  },
  {
    id: "q2",
    prompt: "Pick the primes",
    allowMultiple: true,
    options: [
      { id: "c", text: "2", isCorrect: true },
      { id: "d", text: "3", isCorrect: true },
      { id: "e", text: "4", isCorrect: false },
    ],
  },
] as QuizQuestion[];

describe("buildQuizReview", () => {
  it("never reveals the answer key after a failed attempt (e.g. a blank submission)", () => {
    const review = buildQuizReview(questions, {}, false);
    expect(JSON.stringify(review)).not.toContain("isCorrect");
    expect(review.correctQuestionIds).toEqual([]);
  });

  it("says which questions were right without revealing the answers", () => {
    const answers = { q1: ["b"], q2: ["c"] };
    expect(gradeQuiz(questions, answers, 100).passed).toBe(false);
    expect(buildQuizReview(questions, answers, false).correctQuestionIds).toEqual(["q1"]);
  });

  it("shows the full answers once passed", () => {
    const answers = { q1: ["b"], q2: ["c", "d"] };
    expect(gradeQuiz(questions, answers, 100)).toMatchObject({ passed: true, correctCount: 2 });
    expect(buildQuizReview(questions, answers, true).questions).toEqual(questions);
  });
});
