import { prisma } from "@/lib/prisma";
import { generateReferralCode } from "@/lib/referral";

// Shared by both Google sign-in paths (the OAuth redirect flow and Google
// One Tap) so a Google-authenticated user is found/created/linked exactly
// the same way regardless of which flow they used.
export async function findOrCreateGoogleUser({
  email,
  name,
  googleId,
}: {
  email: string;
  name: string;
  googleId: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const referralCode = await generateReferralCode();
    return prisma.user.create({
      data: { email, name, googleId, emailVerified: true, referralCode },
    });
  }
  if (!existing.googleId) {
    return prisma.user.update({ where: { email }, data: { googleId } });
  }
  return existing;
}
