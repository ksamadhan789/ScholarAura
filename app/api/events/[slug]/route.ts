import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventPeopleSchema } from "@/lib/eventPeople";

const optionalDate = z.preprocess(
  (val) => (val === "" || val == null ? undefined : val),
  z.coerce.date().optional()
);

const updateEventSchema = z
  .object({
    isPublished: z.boolean().optional(),
    thumbnailUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).nullable().optional(),
    brochureUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).nullable().optional(),
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    fee: z.coerce.number().min(0).optional(),
    seatsTotal: z.coerce.number().int().min(1).optional(),
    venueOrLink: z.string().min(1).optional(),
    isOnline: z.boolean().optional(),
    shortDescription: z.string().trim().nullable().optional(),
    eligibility: z.string().trim().nullable().optional(),
    registrationStartDate: optionalDate.nullable(),
    registrationDeadline: optionalDate.nullable(),
    resultDate: optionalDate.nullable(),
    prizeDescription: z.string().trim().nullable().optional(),
    prizeFirst: z.string().trim().nullable().optional(),
    prizeSecond: z.string().trim().nullable().optional(),
    prizeThird: z.string().trim().nullable().optional(),
    certificateLogoUrl: z
      .union([z.string().trim().url("Enter a valid URL"), z.literal("")])
      .nullable()
      .optional(),
    people: eventPeopleSchema.nullable(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Nothing to update",
  });

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const event = await prisma.event.findUnique({ where: { slug: params.slug } });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const d = parsed.data;
  const updated = await prisma.event.update({
    where: { slug: params.slug },
    data: {
      ...(d.isPublished !== undefined && { isPublished: d.isPublished }),
      ...(d.thumbnailUrl !== undefined && { thumbnailUrl: d.thumbnailUrl || null }),
      ...(d.brochureUrl !== undefined && { brochureUrl: d.brochureUrl || null }),
      ...(d.title !== undefined && { title: d.title }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.startDate !== undefined && { startDate: d.startDate }),
      ...(d.endDate !== undefined && { endDate: d.endDate }),
      ...(d.fee !== undefined && { fee: d.fee }),
      ...(d.seatsTotal !== undefined && { seatsTotal: d.seatsTotal }),
      ...(d.venueOrLink !== undefined && { venueOrLink: d.venueOrLink }),
      ...(d.isOnline !== undefined && { isOnline: d.isOnline }),
      ...(d.shortDescription !== undefined && { shortDescription: d.shortDescription || null }),
      ...(d.eligibility !== undefined && { eligibility: d.eligibility || null }),
      ...(d.registrationStartDate !== undefined && { registrationStartDate: d.registrationStartDate }),
      ...(d.registrationDeadline !== undefined && { registrationDeadline: d.registrationDeadline }),
      ...(d.resultDate !== undefined && { resultDate: d.resultDate }),
      ...(d.prizeDescription !== undefined && { prizeDescription: d.prizeDescription || null }),
      ...(d.prizeFirst !== undefined && { prizeFirst: d.prizeFirst || null }),
      ...(d.prizeSecond !== undefined && { prizeSecond: d.prizeSecond || null }),
      ...(d.prizeThird !== undefined && { prizeThird: d.prizeThird || null }),
      ...(d.certificateLogoUrl !== undefined && {
        certificateLogoUrl: d.certificateLogoUrl || null,
      }),
      ...(d.people !== undefined && {
        people: d.people && d.people.length > 0 ? d.people : Prisma.JsonNull,
      }),
    },
  });

  return NextResponse.json(updated);
}
