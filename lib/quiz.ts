import { z } from "zod";

export type QuizOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  // false = pick exactly one option (radio); true = "choose all that apply" (checkboxes).
  allowMultiple: boolean;
  options: QuizOption[];
};

export const quizOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1, "Option text is required"),
  isCorrect: z.boolean(),
});

export const quizQuestionSchema = z
  .object({
    id: z.string().min(1),
    prompt: z.string().trim().min(1, "Question is required"),
    allowMultiple: z.boolean(),
    options: z.array(quizOptionSchema).min(2, "Each question needs at least 2 options"),
  })
  .refine((q) => q.options.some((o) => o.isCorrect), {
    message: "Each question needs at least one correct option",
    path: ["options"],
  })
  .refine((q) => q.allowMultiple || q.options.filter((o) => o.isCorrect).length === 1, {
    message: "A single-answer question must have exactly one correct option",
    path: ["options"],
  });

export const quizQuestionsSchema = z.array(quizQuestionSchema).min(1, "Add at least one question");

/** Selected option IDs per question, keyed by question ID — what a student submits. */
export type QuizAnswers = Record<string, string[]>;

/**
 * A question is correct only if the student's selected set exactly matches
 * the correct set — for a single-answer question that's one ID either way,
 * for "choose all that apply" it means no missed correct option and no
 * extra incorrect one.
 */
export function gradeQuiz(
  questions: QuizQuestion[],
  answers: QuizAnswers,
  passingPercent: number
): { scorePercent: number; passed: boolean; correctCount: number; totalCount: number } {
  let correctCount = 0;
  for (const question of questions) {
    const correctIds = new Set(question.options.filter((o) => o.isCorrect).map((o) => o.id));
    const selectedIds = new Set(answers[question.id] ?? []);
    const isCorrect =
      correctIds.size === selectedIds.size && [...correctIds].every((id) => selectedIds.has(id));
    if (isCorrect) correctCount++;
  }

  const totalCount = questions.length;
  const scorePercent = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);
  return { scorePercent, passed: scorePercent >= passingPercent, correctCount, totalCount };
}

export type QuizQuestionForStudent = {
  id: string;
  prompt: string;
  allowMultiple: boolean;
  options: { id: string; text: string }[];
};

/** Removes the answer key before a quiz is sent to a student who hasn't submitted yet. */
export function stripAnswerKey(questions: QuizQuestion[]): QuizQuestionForStudent[] {
  return questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    allowMultiple: q.allowMultiple,
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
  }));
}
