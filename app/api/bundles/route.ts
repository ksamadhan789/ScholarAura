import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { logAdminAction } from "@/lib/auditLog";

const createBundleSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0, "Price can't be negative"),
  thumbnailUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).optional(),
  courseIds: z.array(z.string().min(1)).min(2, "A bundle needs at least 2 courses"),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createBundleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { title, description, price, thumbnailUrl, courseIds } = parsed.data;

  const uniqueCourseIds = Array.from(new Set(courseIds));
  if (uniqueCourseIds.length !== courseIds.length) {
    return NextResponse.json({ error: "The same course can't be added twice" }, { status: 400 });
  }

  const courseCount = await prisma.course.count({ where: { id: { in: uniqueCourseIds } } });
  if (courseCount !== uniqueCourseIds.length) {
    return NextResponse.json({ error: "One or more selected courses weren't found" }, { status: 404 });
  }

  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.courseBundle.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const bundle = await prisma.courseBundle.create({
    data: {
      title,
      description,
      price,
      thumbnailUrl: thumbnailUrl || null,
      slug,
      items: {
        create: uniqueCourseIds.map((courseId, orderIndex) => ({ courseId, orderIndex })),
      },
    },
  });

  await logAdminAction({
    actorId: session.user.id,
    action: "BUNDLE_CREATED",
    targetType: "CourseBundle",
    targetId: bundle.id,
    metadata: { title: bundle.title, price: Number(bundle.price), courseCount: uniqueCourseIds.length },
  });

  return NextResponse.json(bundle, { status: 201 });
}
