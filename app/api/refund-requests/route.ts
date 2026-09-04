import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import {
  createRefundRequest,
  AlreadyRequestedError,
  NotEligibleError,
} from "@/lib/refundRequest";

const createSchema = z.object({
  kind: z.enum(["course", "event", "competition"]),
  itemId: z.string().min(1),
  reason: z.string().trim().min(10).max(1000),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const created = await createRefundRequest({
      userId: session.user.id,
      kind: parsed.data.kind,
      itemId: parsed.data.itemId,
      reason: parsed.data.reason,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof AlreadyRequestedError) {
      return NextResponse.json(
        { error: "You already have a pending refund request for this" },
        { status: 409 }
      );
    }
    if (err instanceof NotEligibleError) {
      return NextResponse.json(
        { error: "This isn't eligible for a refund request" },
        { status: 400 }
      );
    }
    console.error("Creating refund request failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
