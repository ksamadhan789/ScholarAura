import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadProfilePhoto, downloadProfilePhoto, deleteProfilePhoto } from "@/lib/profilePhotoStorage";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // stay under Vercel's serverless request body limit
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
// Client-supplied MIME type is just a label the browser attaches to whatever
// the user picked, so it's checked separately against the file's actual
// leading bytes — same reasoning as the PDF magic-byte check on resumes.
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
};

function looksLikeDeclaredType(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/webp") {
    // RIFF....WEBP
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  const magic = MAGIC_BYTES[mimeType];
  return !!magic && magic.every((byte, i) => bytes[i] === byte);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
    console.error("Failed to fetch profile photo:", err);
    return NextResponse.json({ error: "Couldn't fetch photo" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form submission" }, { status: 400 });
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File)) {
    return NextResponse.json({ error: "Please attach a photo" }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.has(photo.type)) {
    return NextResponse.json({ error: "Photo must be a JPEG, PNG, or WebP image" }, { status: 400 });
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Photo must be under 4MB" }, { status: 400 });
  }

  const bytes = new Uint8Array(await photo.arrayBuffer());
  if (!looksLikeDeclaredType(bytes, photo.type)) {
    return NextResponse.json({ error: "That file doesn't look like a valid image" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { photoFileId: true },
  });

  try {
    const photoFileId = await uploadProfilePhoto(
      session.user.id,
      `${session.user.name ?? "photo"} - ${photo.name || "photo"}`,
      bytes,
      photo.type
    );

    await prisma.user.update({
      where: { id: session.user.id },
      data: { photoFileId, photoContentType: photo.type },
    });

    if (existing?.photoFileId) {
      await deleteProfilePhoto(existing.photoFileId).catch((err) =>
        console.error(`Failed to delete replaced profile photo ${existing.photoFileId}:`, err)
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Profile photo upload failed:", err);
    return NextResponse.json({ error: "Couldn't upload your photo. Please try again." }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { photoFileId: true },
  });
  if (!user?.photoFileId) {
    return NextResponse.json({ error: "No photo on file" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { photoFileId: null, photoContentType: null },
  });
  await deleteProfilePhoto(user.photoFileId).catch((err) =>
    console.error(`Failed to delete profile photo ${user.photoFileId}:`, err)
  );

  return NextResponse.json({ ok: true });
}
