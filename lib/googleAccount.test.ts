import { describe, expect, it, vi } from "vitest";
import { prismaMock } from "../test/prismaMock";

vi.mock("@/lib/referral", () => ({ generateReferralCode: vi.fn().mockResolvedValue("REF123") }));

import { findOrCreateGoogleUser } from "@/lib/googleAccount";

const google = { email: "owner@example.com", name: "Owner", googleId: "g-1" };

describe("findOrCreateGoogleUser", () => {
  it("creates new Google users as verified", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await findOrCreateGoogleUser(google);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ emailVerified: true, googleId: "g-1" }),
    });
  });

  it("clears an unverified account's password when Google links it", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      email: "owner@example.com",
      googleId: null,
      emailVerified: false,
      passwordHash: "set-by-someone-else",
    } as never);
    await findOrCreateGoogleUser(google);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { email: "owner@example.com" },
      data: { googleId: "g-1", emailVerified: true, passwordHash: null, sessionVersion: { increment: 1 } },
    });
  });

  it("keeps a verified account's password when linking", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      email: "owner@example.com",
      googleId: null,
      emailVerified: true,
      passwordHash: "owners-own",
    } as never);
    await findOrCreateGoogleUser(google);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { email: "owner@example.com" },
      data: { googleId: "g-1", emailVerified: true },
    });
  });

  it("leaves an already-linked, verified account untouched", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ googleId: "g-1", emailVerified: true } as never);
    await findOrCreateGoogleUser(google);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
