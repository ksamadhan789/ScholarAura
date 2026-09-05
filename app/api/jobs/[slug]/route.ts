import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendJobApprovedEmail, sendJobRejectedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notify";
import { logAdminAction } from "@/lib/auditLog";

const updateJobSchema = z
  .object({
    isPublished: z.boolean().optional(),
    approvalStatus: z.enum(["APPROVED", "REJECTED"]).optional(),
    rejectionReason: z.string().trim().nullable().optional(),
    title: z.string().min(3).optional(),
    companyName: z.string().min(1).optional(),
    companyLogoUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).nullable().optional(),
    location: z.string().min(1).optional(),
    isRemote: z.boolean().optional(),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"]).optional(),
    description: z.string().min(10).optional(),
    requirements: z.string().trim().nullable().optional(),
    minExperienceYears: z.coerce.number().int().min(0).nullable().optional(),
    salaryRange: z.string().trim().nullable().optional(),
    applicationDeadline: z.preprocess(
      (val) => (val === "" ? null : val),
      z.coerce.date().nullable().optional()
    ),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Nothing to update",
  });

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (!job.isPublished) {
    const session = await getServerSession(authOptions);
    const isOwner = session?.user.id === job.postedByUserId;
    if (!session || (session.user.role !== "ADMIN" && !isOwner)) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
  }

  return NextResponse.json(job);
}

export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const job = await prisma.job.findUnique({
    where: { slug: params.slug },
    include: { postedByUser: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const d = parsed.data;
  const updated = await prisma.job.update({
    where: { slug: params.slug },
    data: {
      ...(d.isPublished !== undefined && { isPublished: d.isPublished }),
      ...(d.approvalStatus !== undefined && { approvalStatus: d.approvalStatus }),
      ...(d.approvalStatus !== undefined && {
        rejectionReason: d.approvalStatus === "REJECTED" ? d.rejectionReason || null : null,
      }),
      ...(d.title !== undefined && { title: d.title }),
      ...(d.companyName !== undefined && { companyName: d.companyName }),
      ...(d.companyLogoUrl !== undefined && { companyLogoUrl: d.companyLogoUrl || null }),
      ...(d.location !== undefined && { location: d.location }),
      ...(d.isRemote !== undefined && { isRemote: d.isRemote }),
      ...(d.employmentType !== undefined && { employmentType: d.employmentType }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.requirements !== undefined && { requirements: d.requirements || null }),
      ...(d.minExperienceYears !== undefined && { minExperienceYears: d.minExperienceYears }),
      ...(d.salaryRange !== undefined && { salaryRange: d.salaryRange || null }),
      ...(d.applicationDeadline !== undefined && { applicationDeadline: d.applicationDeadline }),
    },
  });

  // Only recruiter-submitted jobs need this notification — the team's own
  // postings are pre-approved and never go through this transition.
  if (d.approvalStatus && job.recruiterProfileId) {
    if (d.approvalStatus === "APPROVED") {
      await logAdminAction({
        actorId: session.user.id,
        action: "JOB_APPROVED",
        targetType: "Job",
        targetId: job.id,
        metadata: { title: updated.title },
      });
      await sendJobApprovedEmail(job.postedByUser.email, job.postedByUser.name, updated.title).catch(
        (err) => console.error("Failed to send job approval email:", err)
      );
      await createNotification({
        userId: job.postedByUserId,
        type: "JOB_APPROVAL_STATUS",
        title: `Your job posting "${updated.title}" was approved`,
        url: "/dashboard/recruiter",
      }).catch((err) => console.error("Failed to create job approval notification:", err));
    } else {
      await logAdminAction({
        actorId: session.user.id,
        action: "JOB_REJECTED",
        targetType: "Job",
        targetId: job.id,
        metadata: { title: updated.title, rejectionReason: updated.rejectionReason },
      });
      await sendJobRejectedEmail(
        job.postedByUser.email,
        job.postedByUser.name,
        updated.title,
        updated.rejectionReason
      ).catch((err) => console.error("Failed to send job rejection email:", err));
      await createNotification({
        userId: job.postedByUserId,
        type: "JOB_APPROVAL_STATUS",
        title: `Your job posting "${updated.title}" was rejected`,
        body: updated.rejectionReason ?? undefined,
        url: "/dashboard/recruiter",
      }).catch((err) => console.error("Failed to create job rejection notification:", err));
    }
  }

  return NextResponse.json(updated);
}
