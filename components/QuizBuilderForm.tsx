"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuizEditor } from "@/components/QuizEditor";
import type { QuizQuestion } from "@/lib/quiz";

export function QuizBuilderForm({
  endpoint,
  backHref,
  hasExistingQuiz,
  initial,
}: {
  endpoint: string;
  backHref: string;
  hasExistingQuiz: boolean;
  initial: { title: string; passingPercent: number; questions: QuizQuestion[] };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [passingPercent, setPassingPercent] = useState(String(initial.passingPercent));
  const [questions, setQuestions] = useState<QuizQuestion[]>(initial.questions);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (questions.length === 0) {
      setError("Add at least one question.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, passingPercent, questions }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save the quiz. Please try again.");
        return;
      }
      router.push(backHref);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this quiz? Students' past attempts will also be removed.")) return;
    setLoading(true);
    try {
      await fetch(endpoint, { method: "DELETE" });
      router.push(backHref);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Quiz title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Passing score (%)</label>
        <input
          type="number"
          min="1"
          max="100"
          required
          value={passingPercent}
          onChange={(e) => setPassingPercent(e.target.value)}
          className="w-full max-w-[8rem] rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <QuizEditor questions={questions} onChange={setQuestions} />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save quiz"}
        </button>
        {hasExistingQuiz && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 disabled:opacity-50 dark:border-red-700 dark:text-red-400"
          >
            Delete quiz
          </button>
        )}
      </div>
    </form>
  );
}
