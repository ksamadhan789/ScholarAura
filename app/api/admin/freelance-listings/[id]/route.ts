import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { ListingNotFoundError, removeFreelanceListing, restoreFreelanceListing } from "@/lib/freelanceReport";
import { createNotification } from "@/lib/notify";
import { logAdminAction } from "@/lib/auditLog";

const actionSchema = z.object({ action: z.enum(["remove", "restore"]) });

// Admin takedown (after a report) or undo of one.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    if (parsed.data.action === "remove") {
      const listing = await removeFreelanceListing(params.id);
      await logAdminAction({
        actorId: session.user.id,
        action: "FREELANCE_LISTING_REMOVED",
        targetType: "FreelanceListing",
        targetId: params.id,
        metadata: { title: listing.title },
      });
      await createNotification({
        userId: listing.postedByUserId,
        type: "FREELANCE_LISTING_REMOVED",
        title: `Your freelance listing "${listing.title}" was removed`,
        body: "An admin took it down after it was reported. Raise a support ticket via Aura if you think this was a mistake.",
        url: "/dashboard/freelance",
      }).catch((err) => console.error("Failed to notify owner of listing removal:", err));
    } else {
      const listing = await restoreFreelanceListing(params.id);
      await logAdminAction({
        actorId: session.user.id,
        action: "FREELANCE_LISTING_RESTORED",
        targetType: "FreelanceListing",
        targetId: params.id,
        metadata: { title: listing.title },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ListingNotFoundError) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    console.error("Freelance listing moderation failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
