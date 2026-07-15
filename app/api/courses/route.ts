import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

const createCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0, "Price can't be negative"),
  category: z.string().min(1, "Category is required"),
});

export async function GET() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    include: { instructor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(courses);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }
  if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only instructors can create courses" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createCourseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { title, description, price, category } = parsed.data;

    const baseSlug = slugify(title);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        price,
        category,
        slug,
        instructorId: session.user.id,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (err) {
    console.error("Course creation failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
