import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadProfilePhoto } from "@/lib/profilePhotoStorage";

// Private -- only the referrer who actually invited this person can see
// their photo, same as "People you've invited" already only shows a
// referrer their own referrals. Deliberately not used on the leaderboard,
// which anonymizes referrers to "First L." specifically so they aren't
// identifiable to every other student -- a real photo there would defeat
// that on purpose.
export async function GET(_request: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const referred = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { referredById: true, photoFileId: true, photoContentType: true },
  });
  if (!referred || referred.referredById !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!referred.photoFileId) {
    return NextResponse.json({ error: "No photo on file" }, { status: 404 });
  }

  try {
    const bytes = await downloadProfilePhoto(referred.photoFileId);
    return new NextResponse(bytes, {
      headers: { "Content-Type": referred.photoContentType ?? "image/jpeg" },
    });
  } catch (err) {
    console.error("Failed to fetch referral photo:", err);
    return NextResponse.json({ error: "Couldn't fetch photo" }, { status: 500 });
  }
}
