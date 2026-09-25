"use client";

import { useMemo, useState } from "react";
import type { Decimal } from "@prisma/client/runtime/library";
import { BookOpen, PlayCircle, UserRound } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { StarRating } from "@/components/StarRating";
import { WishlistButton } from "@/components/courses/WishlistButton";
import { MediaCard, PriceTag } from "@/components/listing/MediaCard";
import {
  CardGrid,
  EmptyState,
  FILTER_FIELD_CLASS,
  FilterGroup,
  FilterOption,
  FilterOptionList,
  FilterPanel,
  ListingShell,
  ResultsSection,
} from "@/components/listing/ListingLayout";
import { COURSE_CATEGORIES } from "@/lib/courseCategories";

type CourseItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: Decimal | string | number;
  thumbnailUrl: string | null;
  instructor: { name: string; photoFileId: string | null };
  rating: { average: number; count: number } | null;
  lectureCount: number;
  totalMinutes: number;
};

function formatLength(minutes: number): string {
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`;
}

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
    <ListingShell
      sidebar={
        <FilterPanel>
          <FilterGroup label="Search">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses…"
              aria-label="Search courses"
              className={FILTER_FIELD_CLASS}
            />
          </FilterGroup>
          <FilterGroup label="Category">
            <FilterOptionList>
              <FilterOption active={category === null} onClick={() => setCategory(null)}>
                All categories
              </FilterOption>
              {categoryOptions.map((c) => (
                <FilterOption key={c} active={category === c} onClick={() => setCategory(c)}>
                  {c}
                </FilterOption>
              ))}
            </FilterOptionList>
          </FilterGroup>
        </FilterPanel>
      }
    >
      {filtered.length === 0 ? (
        <EmptyState
          title={
            courses.length === 0
              ? "No courses published yet"
              : query.trim().length > 0
                ? "No courses match your search"
                : `No courses in ${category ?? "this category"} yet`
          }
          text={courses.length === 0 ? "New courses are on the way — check back soon." : "Try another search or category."}
        />
      ) : (
        <ResultsSection title={`${filtered.length} course${filtered.length === 1 ? "" : "s"}`}>
          <CardGrid>
            {filtered.map((course) => (
              <MediaCard
                key={course.id}
                href={`/courses/${course.slug}`}
                thumbnailUrl={course.thumbnailUrl}
                placeholderIcon={<BookOpen className="h-10 w-10" />}
                title={course.title}
                badges={<Badge variant="brand">{course.category}</Badge>}
                meta={[
                  {
                    icon: UserRound,
                    text: (
                      <span className="flex items-center gap-1.5">
                        <Avatar
                          name={course.instructor.name}
                          src={course.instructor.photoFileId ? `/api/courses/${course.slug}/photo` : null}
                          size={18}
                        />
                        {course.instructor.name}
                      </span>
                    ),
                  },
                  ...(course.lectureCount > 0
                    ? [
                        {
                          icon: PlayCircle,
                          text: `${course.lectureCount} lecture${course.lectureCount === 1 ? "" : "s"}${
                            course.totalMinutes > 0 ? ` · ${formatLength(course.totalMinutes)}` : ""
                          }`,
                        },
                      ]
                    : []),
                  ...(course.rating && course.rating.count > 0
                    ? [
                        {
                          text: (
                            <span className="flex items-center gap-1.5">
                              <StarRating value={course.rating.average} />
                              <span className="text-xs">
                                {course.rating.average.toFixed(1)} ({course.rating.count})
                              </span>
                            </span>
                          ),
                        },
                      ]
                    : []),
                ]}
                footer={<PriceTag amount={course.price} />}
                overlay={
                  isLoggedIn && (
                    <WishlistButton slug={course.slug} isWishlisted={wishlistedSet.has(course.id)} variant="overlay" />
                  )
                }
              />
            ))}
          </CardGrid>
        </ResultsSection>
      )}
    </ListingShell>
  );
}
