import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Pinged once when a lecture page mounts, so completedAt has a real,
 * server-anchored "when did this student first open the lecture" to be
 * checked against — never touched again once set, so re-visiting or
 * refreshing the page can't push the clock forward.
 */
export async function POST(
  _request: Request,
  { params }: { params: { slug: string; videoId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const video = await prisma.courseVideo.findUnique({
    where: { id: params.videoId },
    include: { course: true },
  });
  if (!video || video.course.slug !== params.slug) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }

  const isOwner = video.course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const purchase = await prisma.coursePurchase.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId: video.courseId },
    },
  });

  const isEnrolled = purchase?.status === "SUCCESS";
  if (!video.isPreview && !isEnrolled && !isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
  }

  await prisma.courseProgress.upsert({
    where: {
      userId_courseVideoId: { userId: session.user.id, courseVideoId: video.id },
    },
    update: {},
    create: {
      userId: session.user.id,
      courseVideoId: video.id,
      startedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
