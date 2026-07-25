import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { ExternalCoursePublishToggle } from "./ExternalCoursePublishToggle";

export default async function ManageExternalCoursesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const courses = await prisma.externalCourse.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recommended courses</h1>
        <Link
          href="/dashboard/external-courses/new"
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white"
        >
          + New link
        </Link>
      </div>
      <p className="mb-8 text-sm text-gray-500 dark:text-slate-400">
        These are links to courses hosted elsewhere (Google, Coursera, edX, etc.) —
        ScholarAura doesn&apos;t host their content or issue their certificates,
        we just point students to them.
      </p>

      {courses.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">No recommended courses added yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-4"
            >
              <div>
                <a
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                >
                  {course.title}
                </a>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {course.provider} · {course.category}
                </p>
                <div className="mt-1">
                  <Badge variant={course.isPublished ? "success" : "warning"}>
                    {course.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              </div>
              <ExternalCoursePublishToggle id={course.id} isPublished={course.isPublished} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
