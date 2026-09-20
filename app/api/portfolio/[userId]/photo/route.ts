import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadProfilePhoto } from "@/lib/profilePhotoStorage";

// Public — anyone can fetch a photo from a profile the user has explicitly
// made public, mirroring the public resume route.
export async function GET(_request: Request, { params }: { params: { userId: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { publicProfileEnabled: true, photoFileId: true, photoContentType: true },
  });
  if (!user || !user.publicProfileEnabled || !user.photoFileId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const bytes = await downloadProfilePhoto(user.photoFileId);
    return new NextResponse(bytes, {
      headers: { "Content-Type": user.photoContentType ?? "image/jpeg" },
    });
  } catch (err) {
    console.error("Failed to fetch public profile photo:", err);
    return NextResponse.json({ error: "Couldn't fetch photo" }, { status: 500 });
  }
}
