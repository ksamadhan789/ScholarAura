import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadProfilePhoto } from "@/lib/profilePhotoStorage";

// Admin-only -- used on admin management tables (e.g. certificate issuance
// lists) that already show a user's name, email and organization to the
// admin viewing them, so the photo isn't more sensitive than what's already
// on the page.
export async function GET(_request: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { photoFileId: true, photoContentType: true },
  });
  if (!user?.photoFileId) {
    return NextResponse.json({ error: "No photo on file" }, { status: 404 });
  }

  try {
    const bytes = await downloadProfilePhoto(user.photoFileId);
    return new NextResponse(bytes, {
      headers: { "Content-Type": user.photoContentType ?? "image/jpeg" },
    });
  } catch (err) {
    console.error("Failed to fetch user photo:", err);
    return NextResponse.json({ error: "Couldn't fetch photo" }, { status: 500 });
  }
}
