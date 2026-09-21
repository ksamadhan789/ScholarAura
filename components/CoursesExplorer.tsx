"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Decimal } from "@prisma/client/runtime/library";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { Thumbnail } from "@/components/Thumbnail";
import { StarRating } from "@/components/StarRating";
import { WishlistButton } from "@/components/courses/WishlistButton";
import { FilterPill, FilterPillBar } from "@/components/FilterPill";
import { COURSE_CATEGORIES, COURSE_CATEGORY_ICONS } from "@/lib/courseCategories";

type CourseItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: Decimal | string | number;
  thumbnailUrl: string | null;
  instructor: { name: string; photoFileId: string | null };
  rating: { average: number; count: number } | null;
};

export function CoursesExplorer({
  courses,
  isLoggedIn = false,
  wishlistedCourseIds = [],
}: {
  courses: CourseItem[];
  isLoggedIn?: boolean;
  wishlistedCourseIds?: string[];
}) {
  const wishlistedSet = useMemo(() => new Set(wishlistedCourseIds), [wishlistedCourseIds]);
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

      <FilterPillBar>
        <FilterPill active={category === null} onClick={() => setCategory(null)}>
          ⭐ All
        </FilterPill>
        {categoryOptions.map((c) => (
          <FilterPill key={c} active={category === c} onClick={() => setCategory(c)}>
            {COURSE_CATEGORY_ICONS[c] ?? "📘"} {c}
          </FilterPill>
        ))}
      </FilterPillBar>

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
            <div key={course.id} className="relative">
              {isLoggedIn && (
                <div className="absolute right-2 top-2 z-10">
                  <WishlistButton
                    slug={course.slug}
                    isWishlisted={wishlistedSet.has(course.id)}
                    variant="overlay"
                  />
                </div>
              )}
              <Link
                href={`/courses/${course.slug}`}
                className="block overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
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
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-400">
                    <Avatar
                      name={course.instructor.name}
                      src={course.instructor.photoFileId ? `/api/courses/${course.slug}/photo` : null}
                      size={20}
                    />
                    By {course.instructor.name}
                  </div>
                  {course.rating && course.rating.count > 0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <StarRating value={course.rating.average} />
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        {course.rating.average.toFixed(1)} ({course.rating.count})
                      </span>
                    </div>
                  )}
                  <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                    {Number(course.price) === 0 ? "Free" : `₹${course.price}`}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
