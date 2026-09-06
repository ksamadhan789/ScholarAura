import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteCourseResource } from "@/lib/courseResourceStorage";

async function authorize(slug: string, resourceId: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: "You must be logged in" }, { status: 401 }) };
  }

  const resource = await prisma.courseResource.findUnique({
    where: { id: resourceId },
    include: { course: { select: { slug: true, instructorId: true } } },
  });
  if (!resource || resource.course.slug !== slug) {
    return { error: NextResponse.json({ error: "Resource not found" }, { status: 404 }) };
  }

  const isOwner = resource.course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  }

  return { resource };
}

export async function DELETE(
  _request: Request,
  { params }: { params: { slug: string; resourceId: string } }
) {
  const auth = await authorize(params.slug, params.resourceId);
  if (auth.error) return auth.error;

  await prisma.courseResource.delete({ where: { id: auth.resource.id } });
  await deleteCourseResource(auth.resource.fileId).catch((err) =>
    console.error(`Failed to delete Drive file ${auth.resource.fileId} for resource ${auth.resource.id}:`, err)
  );

  return NextResponse.json({ ok: true });
}
