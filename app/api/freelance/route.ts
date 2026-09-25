import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { httpUrl } from "@/lib/safeUrl";

const createListingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  skills: z.array(z.string().trim().min(1)).max(10).optional(),
  rate: z.string().trim().optional().or(z.literal("")),
  portfolioUrl: z.union([httpUrl(), z.literal("")]).optional(),
  contactEmail: z.string().trim().email("Enter a valid email"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim();

  const listings = await prisma.freelanceListing.findMany({
    where: {
      isPublished: true,
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { postedByUser: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(listings);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const baseSlug = slugify(d.title);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.freelanceListing.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const listing = await prisma.freelanceListing.create({
    data: {
      slug,
      title: d.title,
      category: d.category,
      description: d.description,
      skills: d.skills && d.skills.length > 0 ? d.skills : undefined,
      rate: d.rate || null,
      portfolioUrl: d.portfolioUrl || null,
      contactEmail: d.contactEmail,
      postedByUserId: session.user.id,
    },
  });

  return NextResponse.json(listing, { status: 201 });
}
