import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadProfileResume } from "@/lib/profileResumeStorage";
import { contentDisposition } from "@/lib/contentDisposition";

// Public — anyone can fetch a resume from a profile the user has explicitly
// made public, mirroring how the portfolio page itself works (no auth check).
export async function GET(_request: Request, { params }: { params: { userId: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { publicProfileEnabled: true, resumeFileId: true, resumeName: true },
  });
  if (!user || !user.publicProfileEnabled || !user.resumeFileId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const bytes = await downloadProfileResume(user.resumeFileId);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition("inline", user.resumeName),
      },
    });
  } catch (err) {
    console.error("Failed to fetch public profile resume:", err);
    return NextResponse.json({ error: "Couldn't fetch resume" }, { status: 500 });
  }
}
