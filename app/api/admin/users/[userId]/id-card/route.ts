import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadStudentIdCard } from "@/lib/studentIdCardStorage";

// Admin-only — used on admin entry/management tables that already show a
// user's name and email, for verifying eligibility (e.g. a competition
// entrant's student status) against the ID card they uploaded once on their
// profile.
export async function GET(_request: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { idCardFileId: true, idCardFileName: true, idCardContentType: true },
  });
  if (!user?.idCardFileId) {
    return NextResponse.json({ error: "No ID card on file" }, { status: 404 });
  }

  try {
    const bytes = await downloadStudentIdCard(user.idCardFileId);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": user.idCardContentType ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${user.idCardFileName}"`,
      },
    });
  } catch (err) {
    console.error("Failed to fetch user ID card:", err);
    return NextResponse.json({ error: "Couldn't fetch ID card" }, { status: 500 });
  }
}
