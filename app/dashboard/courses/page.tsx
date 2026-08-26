import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PublishToggle } from "./PublishToggle";
import { Badge } from "@/components/Badge";

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const courses = await prisma.course.findMany({
    where:
      session.user.role === "ADMIN" ? {} : { instructorId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My courses</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/courses/analytics"
            className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
          >
            Analytics
          </Link>
          <Link
            href="/dashboard/courses/new"
            className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white"
          >
            + New course
          </Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">You haven&apos;t created any courses yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-4"
            >
              <div>
                <Link href={`/courses/${course.slug}`} className="font-medium hover:underline">
                  {course.title}
                </Link>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                  <Badge variant={course.isPublished ? "success" : "warning"}>
                    {course.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <span>₹{course.price.toString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/courses/${course.slug}`}
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  Manage lectures
                </Link>
                <PublishToggle slug={course.slug} isPublished={course.isPublished} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
