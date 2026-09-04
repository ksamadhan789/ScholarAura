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
  const video = await prisma.courseVideo.findUnique({
    where: { id: params.videoId },
    include: { course: true },
  });

  if (!video || video.course.slug !== params.slug) {
    notFound();
  }

  // Free previews are meant to be watchable by anonymous visitors sampling
  // a course before signing up, so a session is only required otherwise.
  const session = await getServerSession(authOptions);
  if (!session && !video.isPreview) {
    redirect(`/login?callbackUrl=/courses/${params.slug}/lectures/${video.id}`);
  }

  const isOwner = session?.user.id === video.course.instructorId;
  const isAdmin = session?.user.role === "ADMIN";
  const purchase = session
    ? await prisma.coursePurchase.findUnique({
        where: {
          userId_courseId: { userId: session.user.id, courseId: video.courseId },
        },
      })
    : null;

  const hasAccess = video.isPreview || purchase?.status === "SUCCESS" || isOwner || isAdmin;
  if (!hasAccess) {
    redirect(`/courses/${params.slug}`);
  }

  const progress = session
    ? await prisma.courseProgress.findUnique({
        where: {
          userId_courseVideoId: { userId: session.user.id, courseVideoId: video.id },
        },
      })
    : null;

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
        {session ? (
          <MarkCompleteButton
            slug={params.slug}
            videoId={video.id}
            initiallyCompleted={Boolean(progress?.completedAt)}
          />
        ) : (
          <div className="rounded border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              You&apos;re watching a free preview. Sign up to unlock the full course and track
              your progress.
            </p>
            <Link
              href={`/register?callbackUrl=/courses/${params.slug}`}
              className="mt-3 inline-block rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
