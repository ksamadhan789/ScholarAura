import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasCompletedOnboarding } from "@/lib/onboarding";

export async function POST(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }
  if (!(await hasCompletedOnboarding(session.user.id, session.user.role))) {
    return NextResponse.json(
      { error: "Please complete your profile before enrolling.", code: "ONBOARDING_REQUIRED" },
      { status: 403 }
    );
  }

  const course = await prisma.course.findUnique({ where: { slug: params.slug } });
  if (!course || !course.isPublished) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (Number(course.price) > 0) {
    return NextResponse.json(
      { error: "This course requires payment — use checkout instead" },
      { status: 400 }
    );
  }

  const existing = await prisma.coursePurchase.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });
  if (existing?.status === "SUCCESS") {
    return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
  }

  const purchase = await prisma.coursePurchase.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    update: { status: "SUCCESS", amount: course.price },
    create: {
      userId: session.user.id,
      courseId: course.id,
      amount: course.price,
      status: "SUCCESS",
    },
  });

  // A purchased course no longer needs to be "saved for later".
  await prisma.courseWishlist.deleteMany({
    where: { userId: session.user.id, courseId: course.id },
  });

  return NextResponse.json(purchase, { status: 201 });
}
