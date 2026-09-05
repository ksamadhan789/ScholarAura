import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendRecruiterAccountApprovedEmail, sendRecruiterAccountRejectedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notify";
import { logAdminAction } from "@/lib/auditLog";

const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().trim().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { id: params.id },
    include: { user: true },
  });
  if (!recruiter) {
    return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
  }

  const { status, rejectionReason } = parsed.data;
  const updated = await prisma.recruiterProfile.update({
    where: { id: params.id },
    data: {
      status,
      rejectionReason: status === "REJECTED" ? rejectionReason || null : null,
    },
  });

  if (status === "APPROVED") {
    await logAdminAction({
      actorId: session.user.id,
      action: "RECRUITER_APPROVED",
      targetType: "RecruiterProfile",
      targetId: params.id,
      metadata: { companyName: recruiter.companyName },
    });
    await sendRecruiterAccountApprovedEmail(recruiter.user.email, recruiter.user.name).catch((err) =>
      console.error("Failed to send recruiter approval email:", err)
    );
    await createNotification({
      userId: recruiter.userId,
      type: "RECRUITER_ACCOUNT_STATUS",
      title: "Your recruiter account was approved",
      url: "/dashboard/recruiter",
    }).catch((err) => console.error("Failed to create recruiter approval notification:", err));
  } else {
    // A rejected recruiter's own PATCH route already refuses to publish/edit
    // their jobs going forward, but that alone leaves anything they already
    // published live and appliable indefinitely — candidates could keep
    // applying to a company an admin just flagged as fraudulent. Unpublish
    // everything they've posted; approvalStatus is left alone so a
    // reinstated recruiter's jobs don't need to go back through review, just
    // a manual re-publish via the same toggle.
    const unpublished = await prisma.job.updateMany({
      where: { recruiterProfileId: params.id, isPublished: true },
      data: { isPublished: false },
    });
    await logAdminAction({
      actorId: session.user.id,
      action: "RECRUITER_REJECTED",
      targetType: "RecruiterProfile",
      targetId: params.id,
      metadata: {
        companyName: recruiter.companyName,
        rejectionReason: rejectionReason || null,
        unpublishedJobCount: unpublished.count,
      },
    });
    await sendRecruiterAccountRejectedEmail(
      recruiter.user.email,
      recruiter.user.name,
      rejectionReason || null
    ).catch((err) => console.error("Failed to send recruiter rejection email:", err));
    await createNotification({
      userId: recruiter.userId,
      type: "RECRUITER_ACCOUNT_STATUS",
      title: "Your recruiter account application was rejected",
      body: rejectionReason || undefined,
      url: "/dashboard/recruiter",
    }).catch((err) => console.error("Failed to create recruiter rejection notification:", err));
  }

  return NextResponse.json(updated);
}
