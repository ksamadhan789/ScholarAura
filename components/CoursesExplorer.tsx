"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Decimal } from "@prisma/client/runtime/library";
import { Badge } from "@/components/Badge";
import { Thumbnail } from "@/components/Thumbnail";
import { COURSE_CATEGORIES, COURSE_CATEGORY_ICONS } from "@/lib/courseCategories";

type CourseItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: Decimal | string | number;
  thumbnailUrl: string | null;
  instructor: { name: string };
};

export function CoursesExplorer({ courses }: { courses: CourseItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  // Only show category pills for subjects that actually have courses, plus
  // the standard taxonomy so instructors have somewhere to grow into.
  const presentCategories = useMemo(
    () => Array.from(new Set(courses.map((c) => c.category))),
    [courses]
  );
  const categoryOptions = useMemo(() => {
    const combined = new Set([...COURSE_CATEGORIES, ...presentCategories]);
    return Array.from(combined);
  }, [presentCategories]);

  const filtered = courses.filter((course) => {
    const matchesQuery =
      query.trim().length === 0 ||
      course.title.toLowerCase().includes(query.trim().toLowerCase());
    const matchesCategory = !category || course.category === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <div>
      <div className="mx-auto mb-8 max-w-lg">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ScholarAura courses"
            className="w-full rounded-full border border-slate-300 py-2.5 pl-4 pr-10 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
          >
            🔍
          </span>
        </div>
      </div>

      <div className="mb-10 flex flex-wrap justify-center gap-x-6 gap-y-4">
        <button
          onClick={() => setCategory(null)}
          className="flex w-20 flex-col items-center gap-1.5 text-center"
        >
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition-colors ${
              category === null
                ? "bg-brand-600 text-white"
                : "bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-brand-300"
            }`}
          >
            ⭐
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-400">All</span>
        </button>
        {categoryOptions.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className="flex w-20 flex-col items-center gap-1.5 text-center"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition-colors ${
                category === c
                  ? "bg-brand-600 text-white"
                  : "bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-brand-300"
              }`}
            >
              {COURSE_CATEGORY_ICONS[c] ?? "📘"}
            </span>
            <span className="text-xs leading-tight text-slate-600 dark:text-slate-400">
              {c}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-slate-400">
          {courses.length === 0
            ? "👀 No courses published yet — check back soon!"
            : query.trim().length > 0
              ? "🔍 No courses match your search."
              : `👀 No courses in ${category ?? "this category"} yet.`}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
            >
              <Thumbnail
                url={course.thumbnailUrl}
                alt={course.title}
                icon={COURSE_CATEGORY_ICONS[course.category] ?? "📘"}
              />
              <div className="p-4">
                <Badge variant="brand">{course.category}</Badge>
                <h2 className="mt-2 font-medium text-slate-900 dark:text-white">
                  {course.title}
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                  By {course.instructor.name}
                </p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                  {Number(course.price) === 0 ? "Free" : `₹${course.price}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
