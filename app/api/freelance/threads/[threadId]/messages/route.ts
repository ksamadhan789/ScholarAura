import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notify";

const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Message can't be empty").max(2000, "Message is too long"),
});

async function authorize(threadId: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: "You must be logged in" }, { status: 401 }) };
  }

  const thread = await prisma.freelanceThread.findUnique({
    where: { id: threadId },
    include: { listing: true },
  });
  if (!thread) {
    return { error: NextResponse.json({ error: "Thread not found" }, { status: 404 }) };
  }

  const isInitiator = session.user.id === thread.initiatorId;
  const isOwner = session.user.id === thread.listing.postedByUserId;
  if (!isInitiator && !isOwner) {
    return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  }

  return { session, thread, isInitiator };
}

export async function GET(_request: Request, { params }: { params: { threadId: string } }) {
  const auth = await authorize(params.threadId);
  if (auth.error) return auth.error;

  const messages = await prisma.freelanceMessage.findMany({
    where: { threadId: params.threadId },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(request: Request, { params }: { params: { threadId: string } }) {
  const auth = await authorize(params.threadId);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const message = await prisma.freelanceMessage.create({
    data: {
      threadId: params.threadId,
      senderId: auth.session.user.id,
      body: parsed.data.body,
    },
    include: { sender: { select: { id: true, name: true } } },
  });

  const { thread, isInitiator } = auth;
  const recipientId = isInitiator ? thread.listing.postedByUserId : thread.initiatorId;
  if (recipientId !== auth.session.user.id) {
    await createNotification({
      userId: recipientId,
      type: "FREELANCE_MESSAGE",
      title: isInitiator
        ? `New message about "${thread.listing.title}"`
        : `New reply about "${thread.listing.title}"`,
      url: `/dashboard/freelance/messages/${thread.id}`,
    }).catch((err) => console.error("Failed to create freelance message notification:", err));
  }

  return NextResponse.json(message, { status: 201 });
}
