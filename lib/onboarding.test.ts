import { describe, expect, it } from "vitest";
import { prismaMock } from "../test/prismaMock";
import { hasCompletedOnboarding } from "@/lib/onboarding";

describe("hasCompletedOnboarding", () => {
  it("is always true for non-student roles", async () => {
    await expect(hasCompletedOnboarding("user-1", "INSTRUCTOR")).resolves.toBe(true);
    await expect(hasCompletedOnboarding("user-1", "ADMIN")).resolves.toBe(true);
    await expect(hasCompletedOnboarding("user-1", "RECRUITER")).resolves.toBe(true);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("is false for a student who hasn't completed onboarding", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ onboardingCompletedAt: null } as never);
    await expect(hasCompletedOnboarding("user-1", "STUDENT")).resolves.toBe(false);
  });

  it("is true for a student who has completed onboarding", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ onboardingCompletedAt: new Date() } as never);
    await expect(hasCompletedOnboarding("user-1", "STUDENT")).resolves.toBe(true);
  });

  it("is false if the user can't be found", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(hasCompletedOnboarding("missing", "STUDENT")).resolves.toBe(false);
  });
});
