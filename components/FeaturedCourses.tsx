import Link from "next/link";
import type { Decimal } from "@prisma/client/runtime/library";
import { StarRating } from "@/components/StarRating";

type FeaturedCourse = {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: Decimal | string | number;
  thumbnailUrl: string | null;
  certificateLogoUrl: string | null;
  rating: { average: number; count: number } | null;
  learnerCount: number;
  durationMinutes: number;
};

function formatDuration(minutes: number) {
  if (minutes <= 0) return null;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return hours < 1 ? `${minutes} min` : `${hours} hr${hours === 1 ? "" : "s"}`;
}

export function FeaturedCourses({ courses }: { courses: FeaturedCourse[] }) {
  if (courses.length === 0) return null;

  return (
    <section className="bg-slate-50 py-16 dark:bg-slate-800/30">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Learn something new
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Practical courses designed for students, faculty, researchers and professionals.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((course) => {
            const duration = formatDuration(course.durationMinutes);
            return (
              <div
                key={course.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-600"
              >
                {course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnailUrl} alt="" className="aspect-video w-full object-cover" />
                ) : (
                  <div
                    aria-hidden
                    className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 text-3xl dark:from-slate-700 dark:to-slate-700"
                  >
                    📘
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <span className="w-fit rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-slate-700 dark:text-brand-300">
                    {course.category}
                  </span>
                  <h3 className="mt-2 font-semibold text-slate-900 dark:text-white">{course.title}</h3>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {course.rating && course.rating.count > 0 && (
                      <span className="flex items-center gap-1">
                        <StarRating value={course.rating.average} />
                        {course.rating.average.toFixed(1)}
                      </span>
                    )}
                    {course.learnerCount > 0 && <span>{course.learnerCount} learners</span>}
                    {duration && <span>⏱ {duration}</span>}
                    {course.certificateLogoUrl && <span>🎓 Certificate</span>}
                  </div>

                  <div className="mt-3 flex flex-1 items-end justify-between gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {Number(course.price) === 0 ? "Free" : `₹${course.price}`}
                    </span>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/courses"
            className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            View all courses →
          </Link>
        </div>
      </div>
    </section>
  );
}
