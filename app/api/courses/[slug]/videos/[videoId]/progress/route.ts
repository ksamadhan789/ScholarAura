import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { issueCourseCertificateIfEligible } from "@/lib/certificate";

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

  const progress = await prisma.courseProgress.upsert({
    where: {
      userId_courseVideoId: { userId: session.user.id, courseVideoId: video.id },
    },
    update: { watchedPercent: 100, completedAt: new Date() },
    create: {
      userId: session.user.id,
      courseVideoId: video.id,
      watchedPercent: 100,
      completedAt: new Date(),
    },
  });

  if (isEnrolled) {
    try {
      await issueCourseCertificateIfEligible(session.user.id, video.courseId);
    } catch (err) {
      // Don't fail progress tracking over a certificate-issuance hiccup —
      // it'll be retried the next time this student completes a video.
      console.error("Certificate issuance failed:", err);
    }
  }

  return NextResponse.json(progress);
}
