import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { refundEventRegistration, AlreadyRefundedError, NotRefundableError } from "@/lib/refund";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(_request: Request, { params }: { params: { registrationId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  try {
    const updated = await refundEventRegistration(params.registrationId);
    await logAdminAction({
      actorId: session.user.id,
      action: "REFUND_ISSUED",
      targetType: "EventRegistration",
      targetId: params.registrationId,
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AlreadyRefundedError) {
      return NextResponse.json({ error: "This registration was already refunded" }, { status: 409 });
    }
    if (err instanceof NotRefundableError) {
      return NextResponse.json({ error: "Only a confirmed registration can be refunded" }, { status: 400 });
    }
    console.error("Event registration refund failed:", err);
    return NextResponse.json({ error: "Refund failed. Please try again or check Razorpay directly." }, { status: 502 });
  }
}
