import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFreelanceReport } from "@/lib/freelanceReport";
import { FREELANCE_REPORT_REASONS, isFreelanceReportReason } from "@/lib/freelanceReportReasons";
import { sendFreelanceReportEmail } from "@/lib/email";
import { createNotification } from "@/lib/notify";

const reportSchema = z.object({
  reason: z.string().refine(isFreelanceReportReason, "Pick a reason for the report"),
  details: z.string().trim().max(2000).optional(),
});

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const listing = await prisma.freelanceListing.findUnique({
    where: { slug: params.slug },
    select: { id: true, slug: true, title: true, postedByUserId: true, isPublished: true },
  });
  if (!listing || !listing.isPublished) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.postedByUserId === session.user.id) {
    return NextResponse.json({ error: "You can't report your own listing" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const reason = parsed.data.reason as keyof typeof FREELANCE_REPORT_REASONS;
  const details = parsed.data.details || null;

  const { created } = await createFreelanceReport({
    listingId: listing.id,
    reporterId: session.user.id,
    reason,
    details,
  });

  // Only alert admins for a genuinely new report — re-submitting just
  // updates the reporter's existing open one.
  if (created) {
    const reporterName = session.user.name ?? "A ScholarAura user";
    const reasonLabel = FREELANCE_REPORT_REASONS[reason];
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true, email: true },
    });
    await Promise.all(
      admins.map((admin) =>
        Promise.all([
          sendFreelanceReportEmail(admin.email, admin.name, {
            listingTitle: listing.title,
            listingSlug: listing.slug,
            reporterName,
            reason: reasonLabel,
            details,
          }).catch((err) => console.error("Failed to send freelance report email:", err)),
          createNotification({
            userId: admin.id,
            type: "FREELANCE_REPORT_CREATED",
            title: `Freelance listing reported: ${listing.title}`,
            body: reasonLabel,
            url: "/dashboard/admin/freelance-reports",
          }).catch((err) => console.error("Failed to create freelance report notification:", err)),
        ])
      )
    );
  }

  return NextResponse.json({ ok: true }, { status: created ? 201 : 200 });
}
