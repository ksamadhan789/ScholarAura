import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadProfilePhoto } from "@/lib/profilePhotoStorage";

// Public — a course already shows its instructor's real name to any visitor
// ("By <name>", both on the browse cards and the detail page), so their
// photo is shown at the same visibility level as the course itself: same
// gate as the detail page — published, or the instructor/admin previewing
// a draft.
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    include: { instructor: { select: { id: true, photoFileId: true, photoContentType: true } } },
  });
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!course.isPublished) {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN" && session?.user.id !== course.instructorId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }
  if (!course.instructor.photoFileId) {
    return NextResponse.json({ error: "No photo on file" }, { status: 404 });
  }

  try {
    const bytes = await downloadProfilePhoto(course.instructor.photoFileId);
    return new NextResponse(bytes, {
      headers: { "Content-Type": course.instructor.photoContentType ?? "image/jpeg" },
    });
  } catch (err) {
    console.error("Failed to fetch course instructor photo:", err);
    return NextResponse.json({ error: "Couldn't fetch photo" }, { status: 500 });
  }
}
