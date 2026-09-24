import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dismissFreelanceReport, ReportNotFoundError } from "@/lib/freelanceReport";
import { logAdminAction } from "@/lib/auditLog";

// Dismiss a single report — the admin looked and the listing is fine.
// Removing the listing instead goes through /api/admin/freelance-listings/[id].
export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  try {
    const report = await dismissFreelanceReport(params.id);
    await logAdminAction({
      actorId: session.user.id,
      action: "FREELANCE_REPORT_DISMISSED",
      targetType: "FreelanceReport",
      targetId: params.id,
      metadata: { listingId: report.listingId, reason: report.reason },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ReportNotFoundError) {
      return NextResponse.json({ error: "Report not found or already handled" }, { status: 404 });
    }
    console.error("Dismissing freelance report failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
