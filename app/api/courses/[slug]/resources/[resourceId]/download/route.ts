import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadCourseResource } from "@/lib/courseResourceStorage";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string; resourceId: string } }
) {
  const resource = await prisma.courseResource.findUnique({
    where: { id: params.resourceId },
    include: {
      course: { select: { slug: true, instructorId: true } },
      courseVideo: { select: { isPreview: true } },
    },
  });
  if (!resource || resource.course.slug !== params.slug) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  // A resource attached to a free-preview lecture is downloadable by the
  // same anonymous visitors who can watch that lecture, mirroring the
  // lecture page's own hasAccess check.
  const isFreePreview = resource.courseVideo?.isPreview ?? false;

  const session = await getServerSession(authOptions);
  const isOwner = session?.user.id === resource.course.instructorId;
  const isAdmin = session?.user.role === "ADMIN";

  let hasAccess = isFreePreview || isOwner || isAdmin;
  if (!hasAccess && session) {
    const purchase = await prisma.coursePurchase.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: resource.courseId } },
    });
    hasAccess = purchase?.status === "SUCCESS";
  }
  if (!hasAccess) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  try {
    const bytes = await downloadCourseResource(resource.fileId);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": resource.mimeType,
        "Content-Disposition": `attachment; filename="${resource.fileName}"`,
      },
    });
  } catch (err) {
    console.error("Failed to fetch course resource:", err);
    return NextResponse.json({ error: "Couldn't fetch this file" }, { status: 500 });
  }
}
