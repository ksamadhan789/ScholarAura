import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email", () => ({ sendAccountAlreadyExistsEmail: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(true),
  VERIFY_EMAIL_SEND_LIMIT: 5,
  VERIFY_EMAIL_SEND_WINDOW_MS: 900000,
}));

import { sendAccountAlreadyExistsEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import { handleSignupForExistingAccount, signupResponseBody } from "@/lib/signupExistingAccount";

const account = {
  email: "priya@example.com",
  name: "Priya Sharma",
  passwordHash: "$2a$10$hash",
  deactivatedAt: null,
};

beforeEach(() => {
  vi.mocked(sendAccountAlreadyExistsEmail).mockClear();
  vi.mocked(checkRateLimit).mockClear().mockResolvedValue(true);
});

describe("handleSignupForExistingAccount", () => {
  it("returns exactly what a successful sign-up returns", async () => {
    const body = await handleSignupForExistingAccount(account, "whatever123", "priya@example.com");
    expect(body).toEqual(signupResponseBody("priya@example.com", true));
    expect(Object.keys(body)).toEqual(["email", "needsVerification"]);
  });

  it("emails the real owner how to sign in", async () => {
    await handleSignupForExistingAccount(account, "whatever123", "priya@example.com");
    expect(sendAccountAlreadyExistsEmail).toHaveBeenCalledWith("priya@example.com", "Priya Sharma", {
      hasPassword: true,
    });
  });

  it("tells Google-only accounts to use Google", async () => {
    await handleSignupForExistingAccount({ ...account, passwordHash: null }, "whatever123", "priya@example.com");
    expect(sendAccountAlreadyExistsEmail).toHaveBeenCalledWith("priya@example.com", "Priya Sharma", {
      hasPassword: false,
    });
  });

  it("doesn't email deactivated accounts", async () => {
    await handleSignupForExistingAccount({ ...account, deactivatedAt: new Date() }, "whatever123", "priya@example.com");
    expect(sendAccountAlreadyExistsEmail).not.toHaveBeenCalled();
  });

  it("stops emailing once the per-address limit is hit, but still answers the same", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue(false);
    const body = await handleSignupForExistingAccount(account, "whatever123", "priya@example.com");
    expect(sendAccountAlreadyExistsEmail).not.toHaveBeenCalled();
    expect(body).toEqual(signupResponseBody("priya@example.com", true));
  });
});
