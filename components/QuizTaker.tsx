"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QuizQuestion, QuizQuestionForStudent } from "@/lib/quiz";

type Result = {
  scorePercent: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  questions: QuizQuestion[];
};

export function QuizTaker({
  endpoint,
  passingPercent,
  questions,
}: {
  endpoint: string;
  passingPercent: number;
  questions: QuizQuestionForStudent[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(questionId: string, optionId: string, allowMultiple: boolean) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (allowMultiple) {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [questionId]: next };
      }
      return { ...prev, [questionId]: [optionId] };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't submit the quiz. Please try again.");
        return;
      }
      setResult(data as Result);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function retake() {
    setResult(null);
    setAnswers({});
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <div
          className={`rounded p-4 text-sm ${
            result.passed
              ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
              : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
          }`}
        >
          <p className="font-semibold">
            {result.passed ? "✓ Passed" : "✗ Not yet — try again"} — {result.scorePercent}% (
            {result.correctCount}/{result.totalCount} correct, {passingPercent}% needed)
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {result.questions.map((question) => {
            const selected = new Set(answers[question.id] ?? []);
            return (
              <div
                key={question.id}
                className="rounded border border-gray-200 dark:border-slate-700 p-3 text-sm"
              >
                <p className="font-medium">{question.prompt}</p>
                <div className="mt-2 flex flex-col gap-1">
                  {question.options.map((option) => {
                    const wasSelected = selected.has(option.id);
                    const isCorrect = option.isCorrect;
                    return (
                      <p
                        key={option.id}
                        className={
                          isCorrect
                            ? "text-green-700 dark:text-green-400"
                            : wasSelected
                              ? "text-red-700 dark:text-red-400"
                              : "text-gray-500 dark:text-slate-400"
                        }
                      >
                        {isCorrect ? "✓" : wasSelected ? "✗" : "·"} {option.text}
                        {wasSelected && !isCorrect ? " (your answer)" : ""}
                      </p>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={retake}
          className="self-start rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          {result.passed ? "Retake quiz" : "Try again"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-gray-500 dark:text-slate-400">
        {questions.length} question{questions.length === 1 ? "" : "s"} · {passingPercent}% to pass
      </p>
      {questions.map((question) => (
        <div key={question.id} className="rounded border border-gray-200 dark:border-slate-700 p-3">
          <p className="font-medium">{question.prompt}</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {question.options.map((option) => (
              <label key={option.id} className="flex items-center gap-2 text-sm">
                <input
                  type={question.allowMultiple ? "checkbox" : "radio"}
                  name={question.id}
                  checked={(answers[question.id] ?? []).includes(option.id)}
                  onChange={() => toggle(question.id, option.id, question.allowMultiple)}
                />
                {option.text}
              </label>
            ))}
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="self-start rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit quiz"}
      </button>
    </form>
  );
}
