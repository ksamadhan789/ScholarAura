import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateListingSchema = z
  .object({
    title: z.string().min(3).optional(),
    category: z.string().min(1).optional(),
    description: z.string().min(10).optional(),
    skills: z.array(z.string().trim().min(1)).max(10).nullable().optional(),
    rate: z.string().trim().nullable().optional(),
    portfolioUrl: z
      .union([z.string().trim().url("Enter a valid URL"), z.literal("")])
      .nullable()
      .optional(),
    contactEmail: z.string().trim().email().optional(),
    isPublished: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Nothing to update",
  });

async function requireOwner(slug: string, userId: string) {
  const listing = await prisma.freelanceListing.findUnique({ where: { slug } });
  if (!listing || listing.postedByUserId !== userId) return null;
  return listing;
}

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const listing = await requireOwner(params.slug, session.user.id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  return NextResponse.json(listing);
}

export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const listing = await requireOwner(params.slug, session.user.id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const d = parsed.data;
  const updated = await prisma.freelanceListing.update({
    where: { slug: params.slug },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.category !== undefined && { category: d.category }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.skills !== undefined && {
        skills: d.skills && d.skills.length > 0 ? d.skills : Prisma.JsonNull,
      }),
      ...(d.rate !== undefined && { rate: d.rate || null }),
      ...(d.portfolioUrl !== undefined && { portfolioUrl: d.portfolioUrl || null }),
      ...(d.contactEmail !== undefined && { contactEmail: d.contactEmail }),
      ...(d.isPublished !== undefined && { isPublished: d.isPublished }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const listing = await requireOwner(params.slug, session.user.id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  await prisma.freelanceListing.delete({ where: { slug: params.slug } });
  return NextResponse.json({ ok: true });
}
