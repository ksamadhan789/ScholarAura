import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { resolveSupportTicket, TicketNotFoundError } from "@/lib/supportTicket";
import { sendSupportTicketResolvedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notify";
import { logAdminAction } from "@/lib/auditLog";

const resolveSchema = z.object({
  adminReply: z.string().trim().min(1).max(2000),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const ticket = await resolveSupportTicket(params.id, parsed.data.adminReply);

    await logAdminAction({
      actorId: session.user.id,
      action: "SUPPORT_TICKET_RESOLVED",
      targetType: "SupportTicket",
      targetId: params.id,
      metadata: { query: ticket.query },
    });

    await sendSupportTicketResolvedEmail(ticket.email, ticket.name, ticket.query, parsed.data.adminReply).catch(
      (err) => console.error("Failed to send support ticket resolved email:", err)
    );

    if (ticket.userId) {
      await createNotification({
        userId: ticket.userId,
        type: "SUPPORT_TICKET_RESOLVED",
        title: "Your support ticket got a reply",
        body: parsed.data.adminReply,
      }).catch((err) => console.error("Failed to create support ticket resolved notification:", err));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof TicketNotFoundError) {
      return NextResponse.json({ error: "Ticket not found or already resolved" }, { status: 404 });
    }
    console.error("Resolving support ticket failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
