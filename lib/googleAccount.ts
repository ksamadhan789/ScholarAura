import { Prisma } from "@prisma/client";
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
    try {
      return await prisma.user.create({
        data: { email, name, googleId, emailVerified: true, referralCode },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        // A concurrent sign-in for the same brand-new email (double-click,
        // duplicate tab, One Tap racing a manual click) already created the
        // user — fetch what that request created instead of failing.
        const winner = await prisma.user.findUnique({ where: { email } });
        if (winner) return winner;
      }
      throw err;
    }
  }
  if (!existing.googleId) {
    return prisma.user.update({ where: { email }, data: { googleId } });
  }
  return existing;
}
