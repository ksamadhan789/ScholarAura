import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

const updateBundleSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0, "Price can't be negative"),
  thumbnailUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).optional(),
  isPublished: z.boolean(),
  courseIds: z.array(z.string().min(1)).min(2, "A bundle needs at least 2 courses"),
});

async function authorize(slug: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  }

  const bundle = await prisma.courseBundle.findUnique({ where: { slug } });
  if (!bundle) {
    return { error: NextResponse.json({ error: "Bundle not found" }, { status: 404 }) };
  }

  return { session, bundle };
}

export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const auth = await authorize(params.slug);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = updateBundleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { title, description, price, thumbnailUrl, isPublished, courseIds } = parsed.data;

  const uniqueCourseIds = Array.from(new Set(courseIds));
  if (uniqueCourseIds.length !== courseIds.length) {
    return NextResponse.json({ error: "The same course can't be added twice" }, { status: 400 });
  }

  const courseCount = await prisma.course.count({ where: { id: { in: uniqueCourseIds } } });
  if (courseCount !== uniqueCourseIds.length) {
    return NextResponse.json({ error: "One or more selected courses weren't found" }, { status: 404 });
  }

  const bundle = await prisma.$transaction(async (tx) => {
    await tx.courseBundleItem.deleteMany({ where: { bundleId: auth.bundle.id } });
    return tx.courseBundle.update({
      where: { id: auth.bundle.id },
      data: {
        title,
        description,
        price,
        thumbnailUrl: thumbnailUrl || null,
        isPublished,
        items: {
          create: uniqueCourseIds.map((courseId, orderIndex) => ({ courseId, orderIndex })),
        },
      },
    });
  });

  await logAdminAction({
    actorId: auth.session.user.id,
    action: "BUNDLE_UPDATED",
    targetType: "CourseBundle",
    targetId: bundle.id,
    metadata: { title: bundle.title, price: Number(bundle.price), isPublished: bundle.isPublished },
  });

  return NextResponse.json(bundle);
}

export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const auth = await authorize(params.slug);
  if (auth.error) return auth.error;

  const purchaseCount = await prisma.bundlePurchase.count({ where: { bundleId: auth.bundle.id } });
  if (purchaseCount > 0) {
    return NextResponse.json(
      { error: "Can't delete a bundle that's been purchased — unpublish it instead" },
      { status: 400 }
    );
  }

  await prisma.courseBundle.delete({ where: { id: auth.bundle.id } });

  await logAdminAction({
    actorId: auth.session.user.id,
    action: "BUNDLE_DELETED",
    targetType: "CourseBundle",
    targetId: auth.bundle.id,
    metadata: { title: auth.bundle.title },
  });

  return NextResponse.json({ ok: true });
}
