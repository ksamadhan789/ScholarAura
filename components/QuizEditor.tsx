"use client";

import type { QuizQuestion } from "@/lib/quiz";

function newOption() {
  return { id: crypto.randomUUID(), text: "", isCorrect: false };
}

function newQuestion(): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    prompt: "",
    allowMultiple: false,
    options: [newOption(), newOption()],
  };
}

export function QuizEditor({
  questions,
  onChange,
}: {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}) {
  function updateQuestion(index: number, patch: Partial<QuizQuestion>) {
    onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function removeQuestion(index: number) {
    onChange(questions.filter((_, i) => i !== index));
  }

  function addQuestion() {
    onChange([...questions, newQuestion()]);
  }

  function updateOption(qIndex: number, oIndex: number, patch: Partial<QuizQuestion["options"][number]>) {
    const question = questions[qIndex];
    const options = question.options.map((o, i) => (i === oIndex ? { ...o, ...patch } : o));
    updateQuestion(qIndex, { options });
  }

  function setCorrect(qIndex: number, oIndex: number, checked: boolean) {
    const question = questions[qIndex];
    // Single-answer questions are radios — selecting one clears the rest.
    const options = question.allowMultiple
      ? question.options.map((o, i) => (i === oIndex ? { ...o, isCorrect: checked } : o))
      : question.options.map((o, i) => ({ ...o, isCorrect: i === oIndex }));
    updateQuestion(qIndex, { options });
  }

  function addOption(qIndex: number) {
    const question = questions[qIndex];
    updateQuestion(qIndex, { options: [...question.options, newOption()] });
  }

  function removeOption(qIndex: number, oIndex: number) {
    const question = questions[qIndex];
    updateQuestion(qIndex, { options: question.options.filter((_, i) => i !== oIndex) });
  }

  return (
    <div className="flex flex-col gap-4">
      {questions.map((question, qIndex) => (
        <div
          key={question.id}
          className="flex flex-col gap-3 rounded border border-gray-300 dark:border-slate-600 p-3"
        >
          <div className="flex items-start gap-2">
            <textarea
              placeholder="Question"
              rows={2}
              value={question.prompt}
              onChange={(e) => updateQuestion(qIndex, { prompt: e.target.value })}
              className="flex-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removeQuestion(qIndex)}
              className="shrink-0 text-xs text-red-600 dark:text-red-400"
            >
              Remove question
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={question.allowMultiple}
              onChange={(e) => updateQuestion(qIndex, { allowMultiple: e.target.checked })}
            />
            Choose all that apply (more than one correct option)
          </label>

          <div className="flex flex-col gap-2">
            {question.options.map((option, oIndex) => (
              <div key={option.id} className="flex items-center gap-2">
                <input
                  type={question.allowMultiple ? "checkbox" : "radio"}
                  name={`correct-${question.id}`}
                  checked={option.isCorrect}
                  onChange={(e) => setCorrect(qIndex, oIndex, e.target.checked)}
                  title="Correct answer"
                />
                <input
                  type="text"
                  placeholder={`Option ${oIndex + 1}`}
                  value={option.text}
                  onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                  className="flex-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeOption(qIndex, oIndex)}
                  disabled={question.options.length <= 2}
                  className="text-xs text-red-600 dark:text-red-400 disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addOption(qIndex)}
            className="self-start rounded border border-gray-300 dark:border-slate-600 px-3 py-1 text-xs"
          >
            + Add option
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="self-start rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
      >
        + Add question
      </button>
    </div>
  );
}
