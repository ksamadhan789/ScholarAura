import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadProfilePhoto } from "@/lib/profilePhotoStorage";
import { isActiveJobOwner } from "@/lib/jobOwnership";

// Same access rule as the resume route on this application: the admin, or
// the recruiter who posted the job. Deliberately not gated by
// publicProfileEnabled (unlike the public portfolio photo route) -- an
// applicant who applied to this specific job has already shared their name,
// email and resume with whoever is reviewing it.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: params.id },
    include: { job: true, user: { select: { photoFileId: true, photoContentType: true } } },
  });
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  if (session.user.role !== "ADMIN" && !(await isActiveJobOwner(session.user.id, application.job))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (!application.user.photoFileId) {
    return NextResponse.json({ error: "No photo on file" }, { status: 404 });
  }

  try {
    const bytes = await downloadProfilePhoto(application.user.photoFileId);
    return new NextResponse(bytes, {
      headers: { "Content-Type": application.user.photoContentType ?? "image/jpeg" },
    });
  } catch (err) {
    console.error("Failed to fetch applicant photo:", err);
    return NextResponse.json({ error: "Couldn't fetch photo" }, { status: 500 });
  }
}
