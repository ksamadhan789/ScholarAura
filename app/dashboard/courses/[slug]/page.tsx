import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddVideoForm } from "./AddVideoForm";
import { LectureRow } from "./LectureRow";
import { ListChecks, Paperclip, Pencil, PlayCircle, Plus, Users } from "lucide-react";
import { Badge } from "@/components/Badge";
import {
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DashboardEmptyState,
  DashboardShell,
} from "@/components/dashboard/DashboardShell";

export default async function ManageCoursePage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    include: {
      videos: {
        orderBy: { orderIndex: "asc" },
        include: { quiz: { select: { id: true } }, _count: { select: { resources: true } } },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    redirect("/dashboard/courses");
  }

  const finalQuiz = await prisma.quiz.findFirst({
    where: { courseId: course.id, courseVideoId: null },
    select: { id: true },
  });
  const courseResourceCount = await prisma.courseResource.count({
    where: { courseId: course.id, courseVideoId: null },
  });

  const totalMinutes = Math.round(course.videos.reduce((sum, v) => sum + v.durationSeconds, 0) / 60);

  return (
    <DashboardShell
      title={course.title}
      backHref="/dashboard/courses"
      backLabel={isAdmin && !isOwner ? "All courses" : "My courses"}
      description={
        <span className="inline-flex flex-wrap items-center gap-2">
          <Badge variant={course.isPublished ? "success" : "warning"}>
            {course.isPublished ? "Published" : "Draft"}
          </Badge>
          {course.videos.length} {course.videos.length === 1 ? "lecture" : "lectures"} · {totalMinutes} min in total
        </span>
      }
      actions={
        <>
          <Link href={`/dashboard/courses/${course.slug}/edit`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
            <Pencil aria-hidden className="h-4 w-4" />
            Edit details
          </Link>
          <Link href={`/dashboard/courses/${course.slug}/students`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
            <Users aria-hidden className="h-4 w-4" />
            Students
          </Link>
          <Link href={`/dashboard/courses/${course.slug}/quiz`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
            {finalQuiz ? <ListChecks aria-hidden className="h-4 w-4" /> : <Plus aria-hidden className="h-4 w-4" />}
            Final quiz
          </Link>
          <Link href={`/dashboard/courses/${course.slug}/resources`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
            {courseResourceCount > 0 ? (
              <Paperclip aria-hidden className="h-4 w-4" />
            ) : (
              <Plus aria-hidden className="h-4 w-4" />
            )}
            {courseResourceCount > 0 ? `Resources (${courseResourceCount})` : "Resources"}
          </Link>
        </>
      }
    >
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Lectures</h2>
      <div className="flex flex-col gap-3">
        {course.videos.length === 0 ? (
          <DashboardEmptyState icon={PlayCircle} title="No lectures yet" text="Add your first lecture below." />
        ) : (
          course.videos.map((video, i) => (
            <LectureRow
              key={video.id}
              slug={course.slug}
              video={video}
              hasQuiz={Boolean(video.quiz)}
              resourceCount={video._count.resources}
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
    </DashboardShell>
  );
}
