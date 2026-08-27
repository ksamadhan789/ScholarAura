import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateJobSchema = z
  .object({
    isPublished: z.boolean().optional(),
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

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const d = parsed.data;
  const updated = await prisma.job.update({
    where: { slug: params.slug },
    data: {
      ...(d.isPublished !== undefined && { isPublished: d.isPublished }),
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

  return NextResponse.json(updated);
}
