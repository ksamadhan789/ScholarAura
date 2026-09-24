import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { AlertLimitError, MAX_ALERTS_PER_USER, createJobAlert } from "@/lib/jobAlerts";

const alertSchema = z.object({
  query: z.string().trim().max(200).nullable().optional(),
  employmentType: z.string().nullable().optional(),
  remoteOnly: z.boolean().optional(),
  city: z.string().trim().max(100).nullable().optional(),
});

// Saves the current /jobs search as a daily email alert.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const parsed = alertSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid alert" }, { status: 400 });
  }

  try {
    const alert = await createJobAlert(session.user.id, parsed.data);
    return NextResponse.json({ id: alert.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AlertLimitError) {
      return NextResponse.json(
        { error: `You can have up to ${MAX_ALERTS_PER_USER} job alerts — delete one first` },
        { status: 400 }
      );
    }
    throw err;
  }
}
