import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notify";

const STATUS_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  HIRED: "Hired",
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

  const updated = await prisma.jobApplication.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  if (updated.status !== application.status) {
    await createNotification({
      userId: application.userId,
      type: "JOB_APPLICATION_STATUS",
      title: `Your application for ${application.job.title} is now ${STATUS_LABEL[updated.status]}`,
      url: "/dashboard/job-applications",
    }).catch((err) => console.error("Failed to create job application notification:", err));
  }

  return NextResponse.json(updated);
}
