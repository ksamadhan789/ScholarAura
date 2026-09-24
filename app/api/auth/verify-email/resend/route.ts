import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/emailVerification";

const GENERIC_MESSAGE = "If that account still needs verifying, we've sent a new link.";

// "Resend verification email". Always answers with the same message whether
// or not the account exists / is verified, so it can't be used to discover
// which emails have accounts. Rate-limited per address inside
// sendVerificationEmail.
export async function POST(request: Request) {
  const parsed = z.object({ email: z.string().trim().email() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user && user.passwordHash && !user.emailVerified) {
    await sendVerificationEmail(user).catch((err) => console.error("Failed to resend verification email:", err));
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
