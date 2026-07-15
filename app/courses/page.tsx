import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    include: { instructor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-semibold">Browse courses</h1>

      {courses.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">No courses published yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="rounded-lg border border-gray-200 dark:border-slate-700 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
            >
              <Badge variant="brand">{course.category}</Badge>
              <h2 className="mt-2 font-medium text-slate-900 dark:text-white">{course.title}</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                By {course.instructor.name}
              </p>
              <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                {Number(course.price) === 0 ? "Free" : `₹${course.price}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
