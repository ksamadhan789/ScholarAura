import { prisma } from "@/lib/prisma";

export class TicketNotFoundError extends Error {
  constructor() {
    super("TICKET_NOT_FOUND");
  }
}

/**
 * Raised from Aura when it couldn't answer a question — always captures
 * name/email as plain fields (never just a foreign key) so a ticket from a
 * logged-out visitor still has somewhere to reply, even though userId links
 * it back to the account when one exists.
 */
export async function createSupportTicket(params: {
  userId: string | null;
  name: string;
  email: string;
  query: string;
  message: string;
}) {
  return prisma.supportTicket.create({
    data: {
      userId: params.userId,
      name: params.name,
      email: params.email,
      query: params.query,
      message: params.message,
    },
  });
}

export async function resolveSupportTicket(ticketId: string, adminReply: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.status !== "OPEN") throw new TicketNotFoundError();

  return prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "RESOLVED", adminReply, resolvedAt: new Date() },
  });
}
