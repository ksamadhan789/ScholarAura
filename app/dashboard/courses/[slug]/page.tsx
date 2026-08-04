import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddVideoForm } from "./AddVideoForm";
import { CertificateLogoEditor } from "./CertificateLogoEditor";

export default async function ManageCoursePage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    include: { videos: { orderBy: { orderIndex: "asc" } } },
  });

  if (!course) {
    notFound();
  }

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    redirect("/dashboard/courses");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{course.title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {course.isPublished ? "Published" : "Draft"} · Manage lectures
          </p>
        </div>
        <Link
          href={`/dashboard/courses/${course.slug}/students`}
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Students
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {course.videos.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-400">No lectures added yet.</p>
        ) : (
          course.videos.map((video, i) => (
            <div
              key={video.id}
              className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-3"
            >
              <div>
                <p className="font-medium">
                  {i + 1}. {video.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {Math.round(video.durationSeconds / 60)} min
                  {video.isPreview ? " · Free preview" : ""}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8">
        <AddVideoForm slug={course.slug} />
      </div>

      <CertificateLogoEditor slug={course.slug} certificateLogoUrl={course.certificateLogoUrl} />
    </main>
  );
}
