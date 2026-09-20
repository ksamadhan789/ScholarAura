import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadProfilePhoto } from "@/lib/profilePhotoStorage";

// Public — a course review already shows the reviewer's real name on the
// public course page, so their photo is shown at the same visibility level,
// not gated by the unrelated public-profile toggle.
export async function GET(
  _request: Request,
  { params }: { params: { slug: string; reviewId: string } }
) {
  const review = await prisma.courseReview.findUnique({
    where: { id: params.reviewId },
    include: { course: { select: { slug: true } }, user: { select: { photoFileId: true, photoContentType: true } } },
  });
  if (!review || review.course.slug !== params.slug) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!review.user.photoFileId) {
    return NextResponse.json({ error: "No photo on file" }, { status: 404 });
  }

  try {
    const bytes = await downloadProfilePhoto(review.user.photoFileId);
    return new NextResponse(bytes, {
      headers: { "Content-Type": review.user.photoContentType ?? "image/jpeg" },
    });
  } catch (err) {
    console.error("Failed to fetch reviewer photo:", err);
    return NextResponse.json({ error: "Couldn't fetch photo" }, { status: 500 });
  }
}
