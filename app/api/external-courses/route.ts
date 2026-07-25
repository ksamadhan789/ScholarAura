import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  provider: z.string().min(1, "Provider is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  url: z.string().url("Enter a valid URL"),
  category: z.string().min(1, "Category is required"),
});

export async function GET() {
  const courses = await prisma.externalCourse.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(courses);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const course = await prisma.externalCourse.create({ data: parsed.data });
    return NextResponse.json(course, { status: 201 });
  } catch (err) {
    console.error("External course creation failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
