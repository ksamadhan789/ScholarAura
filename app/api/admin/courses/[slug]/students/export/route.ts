import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsvResponse } from "@/lib/csv";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    include: { videos: { select: { id: true } } },
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const totalVideos = course.videos.length;

  const [purchases, progressCounts] = await Promise.all([
    prisma.coursePurchase.findMany({
      where: { courseId: course.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { purchasedAt: "desc" },
    }),
    prisma.courseProgress.groupBy({
      by: ["userId"],
      where: { completedAt: { not: null }, courseVideo: { courseId: course.id } },
      _count: { _all: true },
    }),
  ]);

  const completedByUser = new Map(progressCounts.map((p) => [p.userId, p._count._all]));

  const header = ["Name", "Email", "Purchased", "Payment status", "Progress"];
  const rows = purchases.map((purchase) => {
    const completed = completedByUser.get(purchase.userId) ?? 0;
    const percent = totalVideos > 0 ? Math.round((completed / totalVideos) * 100) : 0;
    return [
      purchase.user.name,
      purchase.user.email,
      purchase.purchasedAt.toISOString(),
      purchase.status,
      purchase.status === "SUCCESS" && totalVideos > 0 ? `${percent}% (${completed}/${totalVideos})` : "",
    ];
  });

  return toCsvResponse(header, rows, `${course.slug}-students-${new Date().toISOString().slice(0, 10)}.csv`);
}
