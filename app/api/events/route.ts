import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { eventPeopleSchema } from "@/lib/eventPeople";

const eventTypes = [
  "INTERNATIONAL_CONFERENCE",
  "NATIONAL_CONFERENCE",
  "FDP",
  "HANDS_ON_TRAINING",
  "WEBINAR",
] as const;

const optionalDate = z.preprocess(
  (val) => (val === "" || val == null ? undefined : val),
  z.coerce.date().optional()
);

const createEventSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    type: z.enum(eventTypes),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    fee: z.coerce.number().min(0, "Fee can't be negative"),
    seatsTotal: z.coerce.number().int().min(1, "Must allow at least 1 seat"),
    venueOrLink: z.string().min(1, "Venue or link is required"),
    isOnline: z.boolean().optional().default(false),
    thumbnailUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).optional(),
    brochureUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).optional(),
    shortDescription: z.string().trim().optional().or(z.literal("")),
    eligibility: z.string().trim().optional().or(z.literal("")),
    registrationStartDate: optionalDate,
    registrationDeadline: optionalDate,
    resultDate: optionalDate,
    prizeDescription: z.string().trim().optional().or(z.literal("")),
    prizeFirst: z.string().trim().optional().or(z.literal("")),
    prizeSecond: z.string().trim().optional().or(z.literal("")),
    prizeThird: z.string().trim().optional().or(z.literal("")),
    people: eventPeopleSchema,
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after the start date",
    path: ["endDate"],
  });

export async function GET() {
  const events = await prisma.event.findMany({
    where: { isPublished: true },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only admins can create events" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      type,
      startDate,
      endDate,
      fee,
      seatsTotal,
      venueOrLink,
      isOnline,
      thumbnailUrl,
      brochureUrl,
      shortDescription,
      eligibility,
      registrationStartDate,
      registrationDeadline,
      resultDate,
      prizeDescription,
      prizeFirst,
      prizeSecond,
      prizeThird,
      people,
    } = parsed.data;

    const baseSlug = slugify(title);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.event.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        type,
        startDate,
        endDate,
        fee,
        seatsTotal,
        venueOrLink,
        isOnline,
        thumbnailUrl: thumbnailUrl || null,
        brochureUrl: brochureUrl || null,
        shortDescription: shortDescription || null,
        eligibility: eligibility || null,
        registrationStartDate: registrationStartDate ?? null,
        registrationDeadline: registrationDeadline ?? null,
        resultDate: resultDate ?? null,
        prizeDescription: prizeDescription || null,
        prizeFirst: prizeFirst || null,
        prizeSecond: prizeSecond || null,
        prizeThird: prizeThird || null,
        people: people && people.length > 0 ? people : undefined,
        slug,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("Event creation failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
