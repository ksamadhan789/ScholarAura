import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateResetToken, RESET_TOKEN_TTL_MS } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/siteUrl";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkRateLimit, FORGOT_PASSWORD_ATTEMPT_LIMIT, FORGOT_PASSWORD_WINDOW_MS } from "@/lib/rateLimit";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
  turnstileToken: z.string().optional(),
});

const GENERIC_MESSAGE = "If an account exists for that email, we've sent a password reset link.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email, turnstileToken } = parsed.data;

  // Keyed by the target email, not the caller — bounds how many reset
  // emails one victim's inbox can be bombed with, regardless of how many
  // different IPs the requests come from. Still returns the same generic
  // message so this can't be used to enumerate accounts.
  const withinResetLimit = await checkRateLimit(
    `forgot-password:${email.trim().toLowerCase()}`,
    FORGOT_PASSWORD_ATTEMPT_LIMIT,
    FORGOT_PASSWORD_WINDOW_MS
  );
  if (!withinResetLimit) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  if (process.env.TURNSTILE_SECRET_KEY) {
    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Please complete the verification challenge" },
        { status: 400 }
      );
    }
    const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const verified = await verifyTurnstileToken(turnstileToken, remoteIp);
    if (!verified) {
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 400 }
      );
    }
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Only issue a token for accounts that actually have a password to reset
  // (Google-only accounts have none). Always return the same generic
  // response regardless, so this endpoint can't be used to enumerate which
  // emails have accounts on the platform.
  if (user?.passwordHash) {
    const { rawToken, tokenHash } = generateResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${SITE_URL}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
