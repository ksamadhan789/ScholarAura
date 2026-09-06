import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResourceManager } from "@/components/ResourceManager";

export default async function LectureResourcesPage({
  params,
}: {
  params: { slug: string; videoId: string };
}) {
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
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Link
        href={`/dashboard/courses/${video.course.slug}`}
        className="text-sm text-gray-500 hover:underline dark:text-slate-400"
      >
        ← {video.title}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Resources — {video.title}</h1>
      <ResourceManager slug={video.course.slug} videoId={video.id} resources={resources} />
    </main>
  );
}
