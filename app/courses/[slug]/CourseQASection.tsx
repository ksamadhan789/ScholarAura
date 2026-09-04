"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AnswerItem = {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  user: { name: string };
};

type QuestionItem = {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  user: { name: string };
  answers: AnswerItem[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AnswerRow({
  slug,
  questionId,
  answer,
  instructorId,
  currentUserId,
  isAdmin,
}: {
  slug: string;
  questionId: string;
  answer: AnswerItem;
  instructorId: string;
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const canDelete = answer.userId === currentUserId || instructorId === currentUserId || isAdmin;

  async function remove() {
    if (!window.confirm("Delete this answer?")) return;
    await fetch(`/api/courses/${slug}/questions/${questionId}/answers/${answer.id}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <div className="ml-4 border-l-2 border-gray-100 dark:border-slate-800 py-2 pl-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{answer.user.name}</span>
          {answer.userId === instructorId && (
            <span className="rounded bg-brand-100 px-1.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              Instructor
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {formatDate(answer.createdAt)}
          </span>
          {canDelete && (
            <button
              onClick={remove}
              className="text-xs text-red-600 underline dark:text-red-400"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{answer.body}</p>
    </div>
  );
}

function QuestionRow({
  slug,
  question,
  instructorId,
  currentUserId,
  isAdmin,
  canAnswer,
}: {
  slug: string;
  question: QuestionItem;
  instructorId: string;
  currentUserId: string | null;
  isAdmin: boolean;
  canAnswer: boolean;
}) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canDelete = question.userId === currentUserId || instructorId === currentUserId || isAdmin;

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (body.trim().length < 2) {
      setError("Write a bit more before submitting.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${slug}/questions/${question.id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't post your answer. Please try again.");
        return;
      }
      setBody("");
      setReplying(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function removeQuestion() {
    if (!window.confirm("Delete this question and its answers?")) return;
    await fetch(`/api/courses/${slug}/questions/${question.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="border-b border-gray-100 dark:border-slate-800 pb-4 last:border-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{question.user.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {formatDate(question.createdAt)}
          </span>
          {canDelete && (
            <button
              onClick={removeQuestion}
              className="text-xs text-red-600 underline dark:text-red-400"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{question.body}</p>

      {question.answers.map((answer) => (
        <AnswerRow
          key={answer.id}
          slug={slug}
          questionId={question.id}
          answer={answer}
          instructorId={instructorId}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      ))}

      {canAnswer && (
        <div className="ml-4 mt-2">
          {replying ? (
            <form onSubmit={submitAnswer} className="flex flex-col gap-2">
              <textarea
                rows={2}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a reply…"
                className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
              />
              {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-3 py-1.5 text-xs text-white disabled:opacity-50"
                >
                  {loading ? "Posting…" : "Post reply"}
                </button>
                <button
                  type="button"
                  onClick={() => setReplying(false)}
                  className="text-xs text-gray-500 hover:underline dark:text-slate-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setReplying(true)}
              className="text-xs text-brand-600 hover:underline dark:text-brand-400"
            >
              Reply
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function CourseQASection({
  slug,
  questions,
  instructorId,
  isEnrolled,
  currentUserId,
  isAdmin,
  isOwner,
}: {
  slug: string;
  questions: QuestionItem[];
  instructorId: string;
  isEnrolled: boolean;
  currentUserId: string | null;
  isAdmin: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [askBody, setAskBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canAnswer = isEnrolled || isOwner || isAdmin;

  async function submitQuestion(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (askBody.trim().length < 5) {
      setError("Ask a bit more specifically so others can help.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${slug}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: askBody.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't post your question. Please try again.");
        return;
      }
      setAskBody("");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10">
      <h2 className="mb-3 text-lg font-medium">Questions &amp; answers</h2>

      {isEnrolled && (
        <form
          onSubmit={submitQuestion}
          className="mb-6 flex flex-col gap-3 rounded border border-gray-200 dark:border-slate-700 p-4"
        >
          <p className="text-sm font-medium">Ask a question</p>
          <textarea
            rows={3}
            value={askBody}
            onChange={(e) => setAskBody(e.target.value)}
            placeholder="What would you like to know about this course?"
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="self-start rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Posting…" : "Post question"}
          </button>
        </form>
      )}

      {questions.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">No questions yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {questions.map((question) => (
            <QuestionRow
              key={question.id}
              slug={slug}
              question={question}
              instructorId={instructorId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              canAnswer={canAnswer}
            />
          ))}
        </div>
      )}
    </div>
  );
}
