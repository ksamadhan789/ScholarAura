import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { eventPeopleSchema } from "@/lib/eventPeople";

const optionalDate = z.preprocess(
  (val) => (val === "" || val == null ? undefined : val),
  z.coerce.date().optional()
);

const createCompetitionSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    submissionDeadline: z.coerce.date(),
    fee: z.coerce.number().min(0, "Fee can't be negative"),
    prizeDescription: z.string().optional(),
    prizeFirst: z.string().trim().optional().or(z.literal("")),
    prizeSecond: z.string().trim().optional().or(z.literal("")),
    prizeThird: z.string().trim().optional().or(z.literal("")),
    maxTeamSize: z.coerce.number().int().min(1, "Team size must be at least 1"),
    shortDescription: z.string().trim().optional().or(z.literal("")),
    eligibility: z.string().trim().optional().or(z.literal("")),
    registrationStartDate: optionalDate,
    resultDate: optionalDate,
    people: eventPeopleSchema,
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after the start date",
    path: ["endDate"],
  })
  .refine((data) => data.submissionDeadline <= data.endDate, {
    message: "Submission deadline can't be after the competition ends",
    path: ["submissionDeadline"],
  });

export async function GET() {
  const competitions = await prisma.competition.findMany({
    where: { isPublished: true },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(competitions);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only admins can create competitions" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createCompetitionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      startDate,
      endDate,
      submissionDeadline,
      fee,
      prizeDescription,
      prizeFirst,
      prizeSecond,
      prizeThird,
      maxTeamSize,
      shortDescription,
      eligibility,
      registrationStartDate,
      resultDate,
      people,
    } = parsed.data;

    const baseSlug = slugify(title);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.competition.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const competition = await prisma.competition.create({
      data: {
        title,
        description,
        startDate,
        endDate,
        submissionDeadline,
        fee,
        prizeDescription: prizeDescription || null,
        prizeFirst: prizeFirst || null,
        prizeSecond: prizeSecond || null,
        prizeThird: prizeThird || null,
        maxTeamSize,
        shortDescription: shortDescription || null,
        eligibility: eligibility || null,
        registrationStartDate: registrationStartDate ?? null,
        resultDate: resultDate ?? null,
        people: people && people.length > 0 ? people : undefined,
        slug,
      },
    });

    return NextResponse.json(competition, { status: 201 });
  } catch (err) {
    console.error("Competition creation failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
