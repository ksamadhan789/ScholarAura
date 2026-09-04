import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadResume } from "@/lib/jobResumeStorage";
import { sendJobApplicationReceivedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notify";

const MAX_RESUME_BYTES = 4 * 1024 * 1024; // stay under Vercel's serverless request body limit

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job || !job.isPublished) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (job.applicationDeadline && new Date() > job.applicationDeadline) {
    return NextResponse.json({ error: "Applications are closed for this job" }, { status: 400 });
  }

  const existing = await prisma.jobApplication.findUnique({
    where: { jobId_userId: { jobId: job.id, userId: session.user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "You've already applied to this job" }, { status: 409 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form submission" }, { status: 400 });
  }

  const resume = formData.get("resume");
  const coverNote = formData.get("coverNote");

  if (!(resume instanceof File)) {
    return NextResponse.json({ error: "Please attach your resume as a PDF" }, { status: 400 });
  }
  if (resume.type !== "application/pdf") {
    return NextResponse.json({ error: "Resume must be a PDF file" }, { status: 400 });
  }
  if (resume.size > MAX_RESUME_BYTES) {
    return NextResponse.json({ error: "Resume must be under 4MB" }, { status: 400 });
  }

  try {
    const bytes = new Uint8Array(await resume.arrayBuffer());
    const fileName = `${session.user.name ?? "applicant"} - ${resume.name || "resume.pdf"}`;
    const resumeFileId = await uploadResume(job.slug, fileName, bytes);

    const application = await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        userId: session.user.id,
        resumeFileId,
        resumeName: resume.name || "resume.pdf",
        coverNote: typeof coverNote === "string" && coverNote.trim() ? coverNote.trim() : null,
      },
    });

    await sendJobApplicationReceivedEmail(
      session.user.email!,
      session.user.name ?? "",
      job.title,
      job.companyName
    ).catch((err) => console.error("Failed to send job application email:", err));

    if (job.postedByUserId !== session.user.id) {
      const applicantsUrl = job.recruiterProfileId
        ? `/dashboard/recruiter/jobs/${job.slug}/applicants`
        : `/dashboard/jobs/${job.slug}/applicants`;
      await createNotification({
        userId: job.postedByUserId,
        type: "JOB_APPLICATION_RECEIVED",
        title: `${session.user.name} applied to ${job.title}`,
        url: applicantsUrl,
      }).catch((err) => console.error("Failed to create job application notification:", err));
    }

    return NextResponse.json(application, { status: 201 });
  } catch (err) {
    console.error("Job application failed:", err);
    return NextResponse.json({ error: "Couldn't submit your application. Please try again." }, { status: 500 });
  }
}
