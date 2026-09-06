"use client";

import { useState } from "react";

type CourseOption = { id: string; title: string; price: string };

export function BundleCourseSelector({
  allCourses,
  selectedIds,
  onChange,
}: {
  allCourses: CourseOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [addId, setAddId] = useState("");

  const selected = selectedIds
    .map((id) => allCourses.find((c) => c.id === id))
    .filter((c): c is CourseOption => Boolean(c));
  const available = allCourses.filter((c) => !selectedIds.includes(c.id));

  function add() {
    if (!addId) return;
    onChange([...selectedIds, addId]);
    setAddId("");
  }

  function remove(id: string) {
    onChange(selectedIds.filter((i) => i !== id));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="block text-sm font-medium">Courses in this bundle</label>

      {selected.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">No courses added yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {selected.map((course, i) => (
            <div
              key={course.id}
              className="flex items-center justify-between gap-3 rounded border border-gray-200 dark:border-slate-700 p-2"
            >
              <p className="min-w-0 truncate text-sm">
                {i + 1}. {course.title}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="rounded border border-gray-300 dark:border-slate-600 px-2 py-1 text-xs disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === selected.length - 1}
                  aria-label="Move down"
                  className="rounded border border-gray-300 dark:border-slate-600 px-2 py-1 text-xs disabled:opacity-30"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => remove(course.id)}
                  className="rounded border border-gray-300 dark:border-slate-600 px-2 py-1 text-xs text-red-600 dark:text-red-400"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <select
          value={addId}
          onChange={(e) => setAddId(e.target.value)}
          className="flex-1 rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
        >
          <option value="">Choose a course to add…</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} (₹{c.price})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          disabled={!addId}
          className="rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
