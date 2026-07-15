import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedEmbedUrl } from "@/lib/bunny";
import { MarkCompleteButton } from "./MarkCompleteButton";

export default async function LecturePage({
  params,
}: {
  params: { slug: string; videoId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/login`);
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
  const purchase = await prisma.coursePurchase.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId: video.courseId },
    },
  });

  const hasAccess = video.isPreview || purchase?.status === "SUCCESS" || isOwner || isAdmin;
  if (!hasAccess) {
    redirect(`/courses/${params.slug}`);
  }

  const progress = await prisma.courseProgress.findUnique({
    where: {
      userId_courseVideoId: { userId: session.user.id, courseVideoId: video.id },
    },
  });

  const embedUrl = getSignedEmbedUrl(video.videoProviderId);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link href={`/courses/${params.slug}`} className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
        ← Back to {video.course.title}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{video.title}</h1>

      <div className="mt-4 aspect-video w-full overflow-hidden rounded bg-black">
        <iframe
          src={embedUrl}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>

      <div className="mt-6">
        <MarkCompleteButton
          slug={params.slug}
          videoId={video.id}
          initiallyCompleted={Boolean(progress?.completedAt)}
        />
      </div>
    </main>
  );
}
