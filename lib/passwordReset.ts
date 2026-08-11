import crypto from "crypto";

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function generateResetToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString("hex");
  return { rawToken, tokenHash: hashResetToken(rawToken) };
}

// Only the hash is stored in the DB — the raw token lives solely in the
// emailed link, so a database leak alone can't be used to reset accounts.
export function hashResetToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
