import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadProfilePhoto } from "@/lib/profilePhotoStorage";
import { isActiveJobOwner } from "@/lib/jobOwnership";

// Serves either party's photo within a specific message thread — same
// participant check as the thread itself (applicant, the job's recruiter, or
// an admin), and the requested userId must be one of the thread's two real
// participants, not an arbitrary user.
export async function GET(
  request: Request,
  { params }: { params: { applicationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: params.applicationId },
    include: { job: true },
  });
  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isApplicant = session.user.id === application.userId;
  const isRecruiter = await isActiveJobOwner(session.user.id, application.job);
  const isAdmin = session.user.role === "ADMIN";
  if (!isApplicant && !isRecruiter && !isAdmin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const userId = new URL(request.url).searchParams.get("userId");
  if (userId !== application.userId && userId !== application.job.postedByUserId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
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
    console.error("Failed to fetch message sender photo:", err);
    return NextResponse.json({ error: "Couldn't fetch photo" }, { status: 500 });
  }
}
