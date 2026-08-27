import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

const createJobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  companyName: z.string().min(1, "Company name is required"),
  companyLogoUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).optional(),
  location: z.string().min(1, "Location is required"),
  isRemote: z.boolean().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.string().trim().optional().or(z.literal("")),
  minExperienceYears: z.coerce.number().int().min(0).optional(),
  salaryRange: z.string().trim().optional().or(z.literal("")),
  applicationDeadline: z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z.coerce.date().optional()
  ),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employmentType = searchParams.get("employmentType");
  const remoteOnly = searchParams.get("remote") === "true";
  const q = searchParams.get("q")?.trim();

  const jobs = await prisma.job.findMany({
    where: {
      isPublished: true,
      ...(employmentType ? { employmentType: employmentType as never } : {}),
      ...(remoteOnly ? { isRemote: true } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { companyName: { contains: q, mode: "insensitive" } },
              { location: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(jobs);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can post jobs right now" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const d = parsed.data;

    const baseSlug = slugify(`${d.title}-${d.companyName}`);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.job.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const job = await prisma.job.create({
      data: {
        slug,
        title: d.title,
        companyName: d.companyName,
        companyLogoUrl: d.companyLogoUrl || null,
        location: d.location,
        isRemote: d.isRemote ?? false,
        employmentType: d.employmentType,
        description: d.description,
        requirements: d.requirements || null,
        minExperienceYears: d.minExperienceYears ?? null,
        salaryRange: d.salaryRange || null,
        applicationDeadline: d.applicationDeadline ?? null,
        // Team-posted jobs are pre-approved (no moderation queue needed for
        // your own team) but start unpublished, same "create as draft, then
        // publish" pattern used for courses/events/competitions.
        approvalStatus: "APPROVED",
        isPublished: false,
        postedByUserId: session.user.id,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    console.error("Job creation failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
