import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CoursesExplorer } from "@/components/CoursesExplorer";
import { Badge } from "@/components/Badge";

export const metadata: Metadata = {
  title: "Browse Courses",
  description:
    "Explore prerecorded courses from ScholarAura's instructors, covering a wide range of subjects for professionals and academics.",
};

export default async function CoursesPage() {
  const [courses, courseCount, enrollmentCount, certificateCount, externalCourses] =
    await Promise.all([
      prisma.course.findMany({
        where: { isPublished: true },
        include: { instructor: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.coursePurchase.count({ where: { status: "SUCCESS" } }),
      prisma.certificate.count({ where: { courseId: { not: null } } }),
      prisma.externalCourse.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-8 text-center text-2xl font-semibold">Browse courses</h1>

      <CoursesExplorer courses={courses} />

      <div className="mt-16 grid grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50 py-6 text-center dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Courses</p>
          <p className="mt-1 text-2xl font-bold text-brand-700 dark:text-brand-400">
            {courseCount}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Enrollments</p>
          <p className="mt-1 text-2xl font-bold text-brand-700 dark:text-brand-400">
            {enrollmentCount}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Certificates Issued</p>
          <p className="mt-1 text-2xl font-bold text-brand-700 dark:text-brand-400">
            {certificateCount}
          </p>
        </div>
      </div>

      {externalCourses.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-1 text-xl font-semibold text-slate-900 dark:text-white">
            Recommended courses from other providers
          </h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            These courses are hosted and taught by their own providers — clicking
            through takes you to their site to enroll. ScholarAura doesn&apos;t host
            this content or issue these certificates.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {externalCourses.map((course) => (
              <a
                key={course.id}
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-200 dark:border-slate-700 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="neutral">{course.provider}</Badge>
                  <span className="text-xs text-slate-400" aria-hidden>
                    External ↗
                  </span>
                </div>
                <h3 className="mt-2 font-medium text-slate-900 dark:text-white">
                  {course.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {course.description}
                </p>
                <p className="mt-2 text-xs text-slate-400">{course.category}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
