import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateJobSchema = z
  .object({
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
    isPublished: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Nothing to update",
  });

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "RECRUITER") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job || job.postedByUserId !== session.user.id) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}

export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "RECRUITER") {
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

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job || job.postedByUserId !== session.user.id) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!recruiterProfile || recruiterProfile.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Your recruiter account must be approved to manage jobs" },
      { status: 403 }
    );
  }

  const { isPublished, ...content } = parsed.data;
  const isContentEdit = Object.values(content).some((v) => v !== undefined);

  if (isContentEdit) {
    const updated = await prisma.job.update({
      where: { slug: params.slug },
      data: {
        ...(content.title !== undefined && { title: content.title }),
        ...(content.companyName !== undefined && { companyName: content.companyName }),
        ...(content.companyLogoUrl !== undefined && { companyLogoUrl: content.companyLogoUrl || null }),
        ...(content.location !== undefined && { location: content.location }),
        ...(content.isRemote !== undefined && { isRemote: content.isRemote }),
        ...(content.employmentType !== undefined && { employmentType: content.employmentType }),
        ...(content.description !== undefined && { description: content.description }),
        ...(content.requirements !== undefined && { requirements: content.requirements || null }),
        ...(content.minExperienceYears !== undefined && { minExperienceYears: content.minExperienceYears }),
        ...(content.salaryRange !== undefined && { salaryRange: content.salaryRange || null }),
        ...(content.applicationDeadline !== undefined && { applicationDeadline: content.applicationDeadline }),
        // Any edit to a recruiter-submitted job's content sends it back
        // through moderation — otherwise an already-approved posting could
        // be swapped for different content post-review.
        approvalStatus: "PENDING",
        isPublished: false,
        rejectionReason: null,
      },
    });
    return NextResponse.json(updated);
  }

  // A pure publish/pause toggle — doesn't touch content, so it doesn't need
  // to go back through moderation. Only an already-approved job can be
  // published; a pending/rejected one has nothing to toggle yet.
  if (job.approvalStatus !== "APPROVED") {
    return NextResponse.json(
      { error: "This job hasn't been approved yet" },
      { status: 400 }
    );
  }
  const updated = await prisma.job.update({
    where: { slug: params.slug },
    data: { isPublished },
  });
  return NextResponse.json(updated);
}
