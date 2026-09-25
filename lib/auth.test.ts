import { describe, expect, it } from "vitest";
import type { JWT } from "next-auth/jwt";
import { prismaMock } from "../test/prismaMock";
import { authOptions } from "@/lib/auth";

const jwt = (args: { token: JWT; user?: { id: string; email?: string | null } }) =>
  authOptions.callbacks!.jwt!(args as never);

const dbUser = { id: "u1", email: "a@example.com", role: "STUDENT", deactivatedAt: null, sessionVersion: 0 };

describe("jwt callback", () => {
  it("keeps a valid session and refreshes the role from the database", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...dbUser, role: "ADMIN" } as never);
    const token = await jwt({ token: { sub: "u1", email: "a@example.com", sessionVersion: 0 } });
    expect(token).toMatchObject({ sub: "u1", role: "ADMIN" });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("ends the session of a deleted account (email rewritten, row deactivated)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...dbUser,
      email: "deleted-u1@deleted.scholaraura.local",
      deactivatedAt: new Date(),
      sessionVersion: 1,
    } as never);
    await expect(jwt({ token: { sub: "u1", email: "a@example.com", sessionVersion: 0 } })).rejects.toThrow(
      "SESSION_REVOKED"
    );
  });

  it("ends sessions issued before a password reset", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...dbUser, sessionVersion: 1 } as never);
    await expect(jwt({ token: { sub: "u1", sessionVersion: 0 } })).rejects.toThrow("SESSION_REVOKED");
  });

  it("treats tokens from before this change as version 0, so nobody is signed out on deploy", async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser as never);
    await expect(jwt({ token: { sub: "u1", email: "a@example.com" } })).resolves.toMatchObject({ sub: "u1" });
  });

  it("at sign-in looks the user up by email (Google's id is not ours) and stamps the current version", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...dbUser, sessionVersion: 3 } as never);
    const token = await jwt({
      token: { sub: "google-123", email: "a@example.com" },
      user: { id: "google-123", email: "a@example.com" },
    });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: "a@example.com" } });
    expect(token).toMatchObject({ sub: "u1", sessionVersion: 3 });
  });
});
