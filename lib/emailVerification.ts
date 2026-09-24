import { prisma } from "@/lib/prisma";
import { generateResetToken, hashResetToken } from "@/lib/passwordReset";
import { sendEmailVerificationEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/siteUrl";
import { checkRateLimit, VERIFY_EMAIL_SEND_LIMIT, VERIFY_EMAIL_SEND_WINDOW_MS } from "@/lib/rateLimit";

export const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Thrown from the credentials `authorize` — the login page shows a verify prompt for it. */
export const EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED";

/**
 * Whether email/password sign-in requires a verified email. On by default;
 * setting REQUIRE_EMAIL_VERIFICATION=false in Vercel (and redeploying) turns
 * enforcement off without a code change — an emergency switch in case
 * verification emails ever stop being delivered.
 */
export function isEmailVerificationRequired(): boolean {
  return process.env.REQUIRE_EMAIL_VERIFICATION !== "false";
}

/**
 * Whether this user must verify before signing in with a password. Admins
 * are exempt so a broken email provider can never lock the site's operator
 * out of the dashboard they'd need to fix it.
 */
export function mustVerifyBeforeLogin(user: { emailVerified: boolean; role: string }): boolean {
  return isEmailVerificationRequired() && !user.emailVerified && user.role !== "ADMIN";
}

/**
 * Emails a fresh verification link, invalidating any earlier unused ones.
 * Rate-limited per address; returns false (without sending) when limited,
 * when the account is already verified, or when the email fails.
 */
export async function sendVerificationEmail(user: {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}): Promise<boolean> {
  if (user.emailVerified) return false;

  const allowed = await checkRateLimit(
    `verify-email:${user.email.trim().toLowerCase()}`,
    VERIFY_EMAIL_SEND_LIMIT,
    VERIFY_EMAIL_SEND_WINDOW_MS
  );
  if (!allowed) return false;

  const { rawToken, tokenHash } = generateResetToken();
  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS) },
    }),
  ]);

  return sendEmailVerificationEmail(user.email, user.name, `${SITE_URL}/verify-email/${rawToken}`);
}

/**
 * Consumes a link's token. Returns the verified user's email on success,
 * or null for an unknown, used or expired link.
 */
export async function verifyEmailToken(rawToken: string, now: Date = new Date()): Promise<string | null> {
  const token = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashResetToken(rawToken) },
    include: { user: { select: { email: true } } },
  });
  if (!token || token.usedAt || token.expiresAt < now) return null;

  await prisma.$transaction([
    prisma.user.update({ where: { id: token.userId }, data: { emailVerified: true } }),
    prisma.emailVerificationToken.updateMany({
      where: { userId: token.userId, usedAt: null },
      data: { usedAt: now },
    }),
  ]);
  return token.user.email;
}
