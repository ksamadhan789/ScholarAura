import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../test/prismaMock";

vi.mock("@/lib/email", () => ({ sendEmailVerificationEmail: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/rateLimit", async (orig) => ({
  ...(await orig<typeof import("@/lib/rateLimit")>()),
  checkRateLimit: vi.fn().mockResolvedValue(true),
}));

import { sendEmailVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import { hashResetToken } from "@/lib/passwordReset";
import {
  isEmailVerificationRequired,
  mustVerifyBeforeLogin,
  sendVerificationEmail,
  verifyEmailToken,
} from "@/lib/emailVerification";

const user = { id: "u1", email: "new@example.com", name: "New", emailVerified: false };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue(true);
});
afterEach(() => {
  delete process.env.REQUIRE_EMAIL_VERIFICATION;
});

describe("mustVerifyBeforeLogin", () => {
  it("blocks unverified students and recruiters", () => {
    expect(mustVerifyBeforeLogin({ emailVerified: false, role: "STUDENT" })).toBe(true);
    expect(mustVerifyBeforeLogin({ emailVerified: false, role: "RECRUITER" })).toBe(true);
  });

  it("never blocks verified users or admins", () => {
    expect(mustVerifyBeforeLogin({ emailVerified: true, role: "STUDENT" })).toBe(false);
    expect(mustVerifyBeforeLogin({ emailVerified: false, role: "ADMIN" })).toBe(false);
  });

  it("can be switched off with REQUIRE_EMAIL_VERIFICATION=false", () => {
    process.env.REQUIRE_EMAIL_VERIFICATION = "false";
    expect(isEmailVerificationRequired()).toBe(false);
    expect(mustVerifyBeforeLogin({ emailVerified: false, role: "STUDENT" })).toBe(false);
  });
});

describe("sendVerificationEmail", () => {
  it("replaces earlier links and emails a new one", async () => {
    expect(await sendVerificationEmail(user)).toBe(true);
    expect(prismaMock.emailVerificationToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1", usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
    const created = prismaMock.emailVerificationToken.create.mock.calls[0][0].data;
    const url = vi.mocked(sendEmailVerificationEmail).mock.calls[0][2];
    const rawToken = url.split("/verify-email/")[1];
    // Only the hash is stored; the raw token is only in the emailed link.
    expect(created.tokenHash).toBe(hashResetToken(rawToken));
    expect(created.tokenHash).not.toBe(rawToken);
  });

  it("does nothing for verified accounts or when rate-limited", async () => {
    expect(await sendVerificationEmail({ ...user, emailVerified: true })).toBe(false);
    vi.mocked(checkRateLimit).mockResolvedValue(false);
    expect(await sendVerificationEmail(user)).toBe(false);
    expect(sendEmailVerificationEmail).not.toHaveBeenCalled();
  });
});

describe("verifyEmailToken", () => {
  const now = new Date("2026-09-24T12:00:00Z");
  const token = {
    id: "t1",
    userId: "u1",
    usedAt: null,
    expiresAt: new Date("2026-09-25T12:00:00Z"),
    user: { email: "new@example.com" },
  };

  it("verifies the user and uses up their links", async () => {
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue(token as never);
    expect(await verifyEmailToken("raw", now)).toBe("new@example.com");
    expect(prismaMock.emailVerificationToken.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash: hashResetToken("raw") } })
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { emailVerified: true } });
  });

  it("rejects unknown, used and expired links", async () => {
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue(null);
    expect(await verifyEmailToken("raw", now)).toBeNull();
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue({ ...token, usedAt: now } as never);
    expect(await verifyEmailToken("raw", now)).toBeNull();
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue({
      ...token,
      expiresAt: new Date("2026-09-24T11:00:00Z"),
    } as never);
    expect(await verifyEmailToken("raw", now)).toBeNull();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
