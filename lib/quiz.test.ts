import { describe, expect, it } from "vitest";
import { gradeQuiz, stripAnswerKey, type QuizQuestion } from "@/lib/quiz";

const singleAnswer: QuizQuestion = {
  id: "q1",
  prompt: "What is 2 + 2?",
  allowMultiple: false,
  options: [
    { id: "a", text: "3", isCorrect: false },
    { id: "b", text: "4", isCorrect: true },
    { id: "c", text: "5", isCorrect: false },
  ],
};

const multiAnswer: QuizQuestion = {
  id: "q2",
  prompt: "Which are prime?",
  allowMultiple: true,
  options: [
    { id: "a", text: "2", isCorrect: true },
    { id: "b", text: "3", isCorrect: true },
    { id: "c", text: "4", isCorrect: false },
  ],
};

describe("gradeQuiz", () => {
  it("marks a single-answer question correct only when the exact right option is selected", () => {
    const result = gradeQuiz([singleAnswer], { q1: ["b"] }, 70);
    expect(result).toEqual({ scorePercent: 100, passed: true, correctCount: 1, totalCount: 1 });
  });

  it("marks a single-answer question wrong when the wrong option is selected", () => {
    const result = gradeQuiz([singleAnswer], { q1: ["a"] }, 70);
    expect(result.correctCount).toBe(0);
    expect(result.scorePercent).toBe(0);
  });

  it("marks a multi-select question correct only when the exact correct set is selected", () => {
    expect(gradeQuiz([multiAnswer], { q2: ["a", "b"] }, 70).correctCount).toBe(1);
    // Missing one correct option.
    expect(gradeQuiz([multiAnswer], { q2: ["a"] }, 70).correctCount).toBe(0);
    // One extra, incorrect option selected alongside the correct ones.
    expect(gradeQuiz([multiAnswer], { q2: ["a", "b", "c"] }, 70).correctCount).toBe(0);
  });

  it("treats an unanswered question as wrong, not a crash", () => {
    const result = gradeQuiz([singleAnswer, multiAnswer], {}, 70);
    expect(result).toMatchObject({ correctCount: 0, totalCount: 2, passed: false });
  });

  it("computes score as a percentage and applies the passing threshold", () => {
    const result = gradeQuiz([singleAnswer, multiAnswer], { q1: ["b"], q2: ["c"] }, 60);
    expect(result.scorePercent).toBe(50);
    expect(result.passed).toBe(false);

    const passing = gradeQuiz([singleAnswer, multiAnswer], { q1: ["b"], q2: ["c"] }, 40);
    expect(passing.passed).toBe(true);
  });
});

describe("stripAnswerKey", () => {
  it("removes isCorrect from every option without touching question metadata", () => {
    const stripped = stripAnswerKey([singleAnswer]);
    expect(stripped).toEqual([
      {
        id: "q1",
        prompt: "What is 2 + 2?",
        allowMultiple: false,
        options: [
          { id: "a", text: "3" },
          { id: "b", text: "4" },
          { id: "c", text: "5" },
        ],
      },
    ]);
  });
});
