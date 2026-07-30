import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateEventSchema = z
  .object({
    isPublished: z.boolean().optional(),
    brochureUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).nullable().optional(),
  })
  .refine((data) => data.isPublished !== undefined || data.brochureUrl !== undefined, {
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

  const updated = await prisma.event.update({
    where: { slug: params.slug },
    data: {
      ...(parsed.data.isPublished !== undefined && { isPublished: parsed.data.isPublished }),
      ...(parsed.data.brochureUrl !== undefined && { brochureUrl: parsed.data.brochureUrl || null }),
    },
  });

  return NextResponse.json(updated);
}
