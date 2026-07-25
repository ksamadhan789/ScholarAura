import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

const eventTypes = [
  "INTERNATIONAL_CONFERENCE",
  "NATIONAL_CONFERENCE",
  "FDP",
  "HANDS_ON_TRAINING",
  "WEBINAR",
] as const;

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

    const { title, description, type, startDate, endDate, fee, seatsTotal, venueOrLink, isOnline } =
      parsed.data;

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
