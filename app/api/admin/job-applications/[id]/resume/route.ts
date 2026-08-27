import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadResume } from "@/lib/jobResumeStorage";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: params.id },
    include: { job: true },
  });
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  if (session.user.role !== "ADMIN" && session.user.id !== application.job.postedByUserId) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  try {
    const bytes = await downloadResume(application.resumeFileId);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${application.resumeName}"`,
      },
    });
  } catch (err) {
    console.error("Failed to fetch resume:", err);
    return NextResponse.json({ error: "Couldn't fetch resume" }, { status: 500 });
  }
}
