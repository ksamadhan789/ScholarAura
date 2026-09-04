import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddVideoForm } from "./AddVideoForm";
import { LectureRow } from "./LectureRow";

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
        <div className="flex gap-2">
          <Link
            href={`/dashboard/courses/${course.slug}/edit`}
            className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
          >
            Edit details
          </Link>
          <Link
            href={`/dashboard/courses/${course.slug}/students`}
            className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
          >
            Students
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {course.videos.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-400">No lectures added yet.</p>
        ) : (
          course.videos.map((video, i) => (
            <LectureRow
              key={video.id}
              slug={course.slug}
              video={video}
              index={i}
              prev={i > 0 ? course.videos[i - 1] : null}
              next={i < course.videos.length - 1 ? course.videos[i + 1] : null}
            />
          ))
        )}
      </div>

      <div className="mt-8">
        <AddVideoForm slug={course.slug} />
      </div>
    </main>
  );
}
