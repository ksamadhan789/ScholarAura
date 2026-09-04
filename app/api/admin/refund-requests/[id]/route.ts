import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import {
  approveRefundRequest,
  rejectRefundRequest,
  AlreadyRefundedError,
  NotRefundableError,
  RequestNotFoundError,
} from "@/lib/refundRequest";
import { sendRefundRequestApprovedEmail, sendRefundRequestRejectedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notify";

const decisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().trim().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    if (parsed.data.decision === "APPROVE") {
      const info = await approveRefundRequest(params.id);
      await sendRefundRequestApprovedEmail(info.userEmail, info.userName, info.itemTitle).catch((err) =>
        console.error("Failed to send refund approved email:", err)
      );
      await createNotification({
        userId: info.userId,
        type: "REFUND_REQUEST_STATUS",
        title: `Your refund for ${info.itemTitle} was approved`,
        url: info.itemUrl,
      }).catch((err) => console.error("Failed to create refund approved notification:", err));
    } else {
      const reason = parsed.data.rejectionReason || null;
      const info = await rejectRefundRequest(params.id, reason);
      await sendRefundRequestRejectedEmail(info.userEmail, info.userName, info.itemTitle, reason).catch(
        (err) => console.error("Failed to send refund rejected email:", err)
      );
      await createNotification({
        userId: info.userId,
        type: "REFUND_REQUEST_STATUS",
        title: `Your refund request for ${info.itemTitle} was rejected`,
        body: reason ?? undefined,
        url: info.itemUrl,
      }).catch((err) => console.error("Failed to create refund rejected notification:", err));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RequestNotFoundError) {
      return NextResponse.json({ error: "Refund request not found or already resolved" }, { status: 404 });
    }
    if (err instanceof AlreadyRefundedError) {
      return NextResponse.json({ error: "This was already refunded" }, { status: 409 });
    }
    if (err instanceof NotRefundableError) {
      return NextResponse.json({ error: "This is no longer refundable" }, { status: 400 });
    }
    console.error("Resolving refund request failed:", err);
    return NextResponse.json(
      { error: "Refund failed. Please try again or check Razorpay directly." },
      { status: 502 }
    );
  }
}
