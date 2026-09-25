import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResourceManager } from "@/components/ResourceManager";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function LectureResourcesPage({ params }: { params: { slug: string; videoId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const video = await prisma.courseVideo.findUnique({
    where: { id: params.videoId },
    include: { course: true },
  });
  if (!video || video.course.slug !== params.slug) {
    notFound();
  }

  const isOwner = video.course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    redirect("/dashboard/courses");
  }

  const resources = await prisma.courseResource.findMany({
    where: { courseVideoId: video.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardShell
      narrow
      title={`Resources — ${video.title}`}
      backHref={`/dashboard/courses/${video.course.slug}`}
      backLabel={video.course.title}
    >
      <ResourceManager slug={video.course.slug} videoId={video.id} resources={resources} />
    </DashboardShell>
  );
}
