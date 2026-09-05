import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notify";
import { logAdminAction } from "@/lib/auditLog";

const STATUS_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  HIRED: "Hired",
};

// Applied and Shortlisted are working states a candidate can move between;
// Rejected and Hired are outcomes and stay terminal — reversing either
// through this same dropdown (un-rejecting, un-hiring) isn't a status
// update, it's a decision that deserves its own deliberate path, not a
// silent flip with no trail of who did it or why.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  APPLIED: ["APPLIED", "SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["SHORTLISTED", "APPLIED", "REJECTED", "HIRED"],
  REJECTED: ["REJECTED"],
  HIRED: ["HIRED"],
};

const updateStatusSchema = z.object({
  status: z.enum(["APPLIED", "SHORTLISTED", "REJECTED", "HIRED"]),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
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

  const allowedNextStatuses = ALLOWED_TRANSITIONS[application.status] ?? [];
  if (!allowedNextStatuses.includes(parsed.data.status)) {
    return NextResponse.json(
      {
        error: `Can't move a ${STATUS_LABEL[application.status]} application to ${STATUS_LABEL[parsed.data.status]}`,
      },
      { status: 400 }
    );
  }

  const updated = await prisma.jobApplication.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  if (updated.status !== application.status) {
    await logAdminAction({
      actorId: session.user.id,
      action: "JOB_APPLICATION_STATUS_CHANGED",
      targetType: "JobApplication",
      targetId: params.id,
      metadata: { jobTitle: application.job.title, from: application.status, to: updated.status },
    });
    await createNotification({
      userId: application.userId,
      type: "JOB_APPLICATION_STATUS",
      title: `Your application for ${application.job.title} is now ${STATUS_LABEL[updated.status]}`,
      url: "/dashboard/job-applications",
    }).catch((err) => console.error("Failed to create job application notification:", err));
  }

  return NextResponse.json(updated);
}
