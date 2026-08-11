import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateCourseSchema = z
  .object({
    isPublished: z.boolean().optional(),
    certificateLogoUrl: z
      .union([z.string().trim().url("Enter a valid URL"), z.literal("")])
      .nullable()
      .optional(),
    thumbnailUrl: z
      .union([z.string().trim().url("Enter a valid URL"), z.literal("")])
      .nullable()
      .optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Nothing to update",
  });

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    include: { instructor: { select: { name: true } } },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  return NextResponse.json(course);
}

export async function PATCH(
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

  const body = await request.json();
  const parsed = updateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const updated = await prisma.course.update({
    where: { slug: params.slug },
    data: {
      ...(d.isPublished !== undefined && { isPublished: d.isPublished }),
      ...(d.certificateLogoUrl !== undefined && {
        certificateLogoUrl: d.certificateLogoUrl || null,
      }),
      ...(d.thumbnailUrl !== undefined && { thumbnailUrl: d.thumbnailUrl || null }),
    },
  });

  return NextResponse.json(updated);
}
