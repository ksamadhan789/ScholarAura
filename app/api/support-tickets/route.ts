import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupportTicket } from "@/lib/supportTicket";
import { sendSupportTicketCreatedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notify";

const guestSchema = z.object({
  query: z.string().trim().min(1).max(500),
  message: z.string().trim().min(5).max(2000),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
});

const sessionSchema = z.object({
  query: z.string().trim().min(1).max(500),
  message: z.string().trim().min(5).max(2000),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  const parsed = session ? sessionSchema.safeParse(body) : guestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const name = session ? (session.user.name ?? "ScholarAura user") : (parsed.data as z.infer<typeof guestSchema>).name;
  const email = session ? (session.user.email ?? "") : (parsed.data as z.infer<typeof guestSchema>).email;

  const ticket = await createSupportTicket({
    userId: session?.user.id ?? null,
    name,
    email,
    query: parsed.data.query,
    message: parsed.data.message,
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true },
  });

  await Promise.all(
    admins.map((admin) =>
      Promise.all([
        sendSupportTicketCreatedEmail(admin.email, admin.name, { name, email, query: ticket.query, message: ticket.message }).catch(
          (err) => console.error("Failed to send support ticket created email:", err)
        ),
        createNotification({
          userId: admin.id,
          type: "SUPPORT_TICKET_CREATED",
          title: `New support ticket from ${name}`,
          body: ticket.query,
          url: "/dashboard/admin/support-tickets",
        }).catch((err) => console.error("Failed to create support ticket notification:", err)),
      ])
    )
  );

  return NextResponse.json({ ok: true, id: ticket.id }, { status: 201 });
}
