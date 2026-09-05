import { prisma } from "@/lib/prisma";

/**
 * Students must complete onboarding before buying or registering for
 * anything — onboardingCompletedAt and consentAcceptedAt are always set
 * together (see app/api/account/onboarding/route.ts), so this is also the
 * only place Terms/Privacy acceptance is enforced. Other roles never go
 * through the onboarding flow, so they're always allowed.
 */
export async function hasCompletedOnboarding(userId: string, role: string): Promise<boolean> {
  if (role !== "STUDENT") return true;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingCompletedAt: true },
  });
  return Boolean(user?.onboardingCompletedAt);
}
