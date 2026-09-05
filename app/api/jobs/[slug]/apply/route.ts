import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadResume, deleteResume } from "@/lib/jobResumeStorage";
import { sendJobApplicationReceivedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notify";

const MAX_RESUME_BYTES = 4 * 1024 * 1024; // stay under Vercel's serverless request body limit
// "%PDF-" — the client-supplied MIME type is just a label the browser attaches
// to whatever the user picked, so it's checked separately against the file's
// actual leading bytes rather than trusted on its own.
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d];

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

  // A quick, non-atomic check — it saves an upload in the common case, but
  // two concurrent submissions can both pass it, so it's not the real guard
  // against a duplicate application (that's the P2002 handling below).
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

  const bytes = new Uint8Array(await resume.arrayBuffer());
  if (!PDF_MAGIC_BYTES.every((byte, i) => bytes[i] === byte)) {
    return NextResponse.json({ error: "That file doesn't look like a valid PDF" }, { status: 400 });
  }

  try {
    const fileName = `${session.user.name ?? "applicant"} - ${resume.name || "resume.pdf"}`;
    const resumeFileId = await uploadResume(job.slug, fileName, bytes);

    let application;
    try {
      application = await prisma.jobApplication.create({
        data: {
          jobId: job.id,
          userId: session.user.id,
          resumeFileId,
          resumeName: resume.name || "resume.pdf",
          coverNote: typeof coverNote === "string" && coverNote.trim() ? coverNote.trim() : null,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        // Lost a race against a concurrent submission from the same user —
        // the resume we just uploaded has no application row to attach to,
        // so clean it up rather than leaving it orphaned in Drive.
        await deleteResume(resumeFileId).catch((cleanupErr) =>
          console.error(`Failed to clean up orphaned resume ${resumeFileId}:`, cleanupErr)
        );
        return NextResponse.json({ error: "You've already applied to this job" }, { status: 409 });
      }
      throw err;
    }

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

export async function DELETE(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const application = await prisma.jobApplication.findUnique({
    where: { jobId_userId: { jobId: job.id, userId: session.user.id } },
  });
  if (!application) {
    return NextResponse.json({ error: "You haven't applied to this job" }, { status: 404 });
  }
  // Hired is a real outcome, not a working state — withdrawing it isn't a
  // candidate self-service action. Applied/Shortlisted/Rejected can all be
  // withdrawn, which also frees the (jobId, userId) slot up for a re-apply.
  if (application.status === "HIRED") {
    return NextResponse.json({ error: "Can't withdraw a hired application" }, { status: 400 });
  }

  await prisma.jobApplication.delete({ where: { id: application.id } });
  await deleteResume(application.resumeFileId).catch((err) =>
    console.error(`Failed to delete resume ${application.resumeFileId} for withdrawn application ${application.id}:`, err)
  );

  if (job.postedByUserId !== session.user.id) {
    const applicantsUrl = job.recruiterProfileId
      ? `/dashboard/recruiter/jobs/${job.slug}/applicants`
      : `/dashboard/jobs/${job.slug}/applicants`;
    await createNotification({
      userId: job.postedByUserId,
      type: "JOB_APPLICATION_WITHDRAWN",
      title: `${session.user.name} withdrew their application for ${job.title}`,
      url: applicantsUrl,
    }).catch((err) => console.error("Failed to create job application withdrawal notification:", err));
  }

  return NextResponse.json({ ok: true });
}
