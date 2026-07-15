import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const addVideoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  videoProviderId: z.string().min(1, "Bunny video GUID is required"),
  durationMinutes: z.coerce.number().min(0, "Duration can't be negative"),
  isPreview: z.boolean().optional().default(false),
});

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({ where: { slug: params.slug } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = addVideoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { title, videoProviderId, durationMinutes, isPreview } = parsed.data;

    const videoCount = await prisma.courseVideo.count({
      where: { courseId: course.id },
    });

    const video = await prisma.courseVideo.create({
      data: {
        courseId: course.id,
        title,
        videoProviderId,
        durationSeconds: Math.round(durationMinutes * 60),
        orderIndex: videoCount,
        isPreview,
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (err) {
    console.error("Adding video failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
