import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateVideoSchema = z
  .object({
    title: z.string().min(1, "Title is required").optional(),
    videoProviderId: z.string().min(1, "Bunny video GUID is required").optional(),
    durationMinutes: z.coerce.number().min(0, "Duration can't be negative").optional(),
    isPreview: z.boolean().optional(),
    orderIndex: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Nothing to update",
  });

async function authorize(slug: string, videoId: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: "You must be logged in" }, { status: 401 }) };
  }

  const video = await prisma.courseVideo.findUnique({
    where: { id: videoId },
    include: { course: { select: { slug: true, instructorId: true } } },
  });
  if (!video || video.course.slug !== slug) {
    return { error: NextResponse.json({ error: "Lecture not found" }, { status: 404 }) };
  }

  const isOwner = video.course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  }

  return { video };
}

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string; videoId: string } }
) {
  const auth = await authorize(params.slug, params.videoId);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = updateVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const updated = await prisma.courseVideo.update({
    where: { id: params.videoId },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.videoProviderId !== undefined && { videoProviderId: d.videoProviderId }),
      ...(d.durationMinutes !== undefined && {
        durationSeconds: Math.round(d.durationMinutes * 60),
      }),
      ...(d.isPreview !== undefined && { isPreview: d.isPreview }),
      ...(d.orderIndex !== undefined && { orderIndex: d.orderIndex }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { slug: string; videoId: string } }
) {
  const auth = await authorize(params.slug, params.videoId);
  if (auth.error) return auth.error;

  // Progress rows are per-student watch-tracking metadata, not a record
  // worth preserving once the lecture itself is gone — clear them in the
  // same transaction so the video's RESTRICT-by-default FK doesn't block
  // deleting a lecture students have already watched.
  await prisma.$transaction([
    prisma.courseProgress.deleteMany({ where: { courseVideoId: params.videoId } }),
    prisma.courseVideo.delete({ where: { id: params.videoId } }),
  ]);

  return NextResponse.json({ ok: true });
}
