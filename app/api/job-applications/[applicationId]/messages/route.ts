import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notify";

const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Message can't be empty").max(2000, "Message is too long"),
});

async function authorize(applicationId: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: "You must be logged in" }, { status: 401 }) };
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });
  if (!application) {
    return { error: NextResponse.json({ error: "Application not found" }, { status: 404 }) };
  }

  const isApplicant = session.user.id === application.userId;
  const isRecruiter = session.user.id === application.job.postedByUserId;
  const isAdmin = session.user.role === "ADMIN";
  if (!isApplicant && !isRecruiter && !isAdmin) {
    return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  }

  return { session, application, isApplicant };
}

export async function GET(_request: Request, { params }: { params: { applicationId: string } }) {
  const auth = await authorize(params.applicationId);
  if (auth.error) return auth.error;

  const messages = await prisma.jobMessage.findMany({
    where: { applicationId: params.applicationId },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(request: Request, { params }: { params: { applicationId: string } }) {
  const auth = await authorize(params.applicationId);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const message = await prisma.jobMessage.create({
    data: {
      applicationId: params.applicationId,
      senderId: auth.session.user.id,
      body: parsed.data.body,
    },
    include: { sender: { select: { id: true, name: true } } },
  });

  const { application, isApplicant } = auth;
  const recipientId = isApplicant ? application.job.postedByUserId : application.userId;
  if (recipientId !== auth.session.user.id) {
    // A recruiter-posted job has a recruiterProfileId; an admin-posted one
    // doesn't — that's the same distinction the job itself already encodes,
    // reused here to send the recipient to the right dashboard section.
    const threadUrl = isApplicant
      ? application.job.recruiterProfileId
        ? `/dashboard/recruiter/jobs/${application.job.slug}/applicants/${application.id}/messages`
        : `/dashboard/jobs/${application.job.slug}/applicants/${application.id}/messages`
      : `/dashboard/job-applications/${application.id}/messages`;

    await createNotification({
      userId: recipientId,
      type: "JOB_MESSAGE",
      title: isApplicant
        ? `New message about the application for ${application.job.title}`
        : `New message about your application to ${application.job.title}`,
      url: threadUrl,
    }).catch((err) => console.error("Failed to create job message notification:", err));
  }

  return NextResponse.json(message, { status: 201 });
}
