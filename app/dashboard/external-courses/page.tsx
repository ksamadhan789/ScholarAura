import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { ExternalCoursePublishToggle } from "./ExternalCoursePublishToggle";
import { ExternalLink, Link2, Plus } from "lucide-react";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_PRIMARY_BUTTON_CLASS,
  DashboardEmptyState,
  DashboardShell,
} from "@/components/dashboard/DashboardShell";

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
    <DashboardShell
      title="Recommended courses"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description="Links to courses hosted elsewhere (Google, Coursera, edX and others). ScholarAura doesn't host their content or issue their certificates — we just point students to them."
      actions={
        <Link href="/dashboard/external-courses/new" className={`${DASHBOARD_PRIMARY_BUTTON_CLASS} py-1.5`}>
          <Plus aria-hidden className="h-4 w-4" />
          New link
        </Link>
      }
    >
      {courses.length === 0 ? (
        <DashboardEmptyState
          icon={Link2}
          title="No recommended courses yet"
          href="/dashboard/external-courses/new"
          cta="Add a link"
        />
      ) : (
        <ul className="space-y-3">
          {courses.map((course) => (
            <li
              key={course.id}
              className={`${DASHBOARD_CARD_CLASS} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}
            >
              <div className="flex min-w-0 gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  <Link2 aria-hidden className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                    >
                      {course.title}
                      <ExternalLink aria-hidden className="h-3.5 w-3.5 text-slate-400" />
                    </a>
                    <Badge variant={course.isPublished ? "success" : "warning"}>
                      {course.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {course.provider} · {course.category}
                  </p>
                </div>
              </div>
              <ExternalCoursePublishToggle id={course.id} isPublished={course.isPublished} />
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
