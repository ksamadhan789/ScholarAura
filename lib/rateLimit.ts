import { prisma } from "@/lib/prisma";

// Shared across all three checkout routes (course/event/competition) — one
// budget per user regardless of which type of purchase they're attempting.
export const CHECKOUT_ATTEMPT_LIMIT = 20;
export const CHECKOUT_WINDOW_MS = 5 * 60 * 1000;

// Stricter and separate from the general checkout limit — targets someone
// rapidly trying many different coupon codes to find one that works, not
// normal checkout retries.
export const COUPON_ATTEMPT_LIMIT = 10;
export const COUPON_WINDOW_MS = 10 * 60 * 1000;

// Keyed by IP (no account exists yet to key by) — bounds automated mass
// account creation. Turnstile already gates this when configured, but that's
// optional; this applies regardless.
export const REGISTER_ATTEMPT_LIMIT = 10;
export const REGISTER_WINDOW_MS = 15 * 60 * 1000;

// Keyed by the target email, not IP — the threat here is a victim's inbox
// getting bombed with reset emails, which an attacker can do from any
// number of IPs but only by naming the same victim address each time.
export const FORGOT_PASSWORD_ATTEMPT_LIMIT = 5;
export const FORGOT_PASSWORD_WINDOW_MS = 15 * 60 * 1000;

/**
 * Fixed-window rate limiter backed by Postgres so it's correct across every
 * serverless instance (unlike an in-memory counter, which each cold start
 * would reset and each concurrent instance would track separately). One row
 * per key is reused across windows — the table doesn't grow with request
 * volume, only with the number of distinct keys ever seen.
 *
 * Returns true if the request is allowed, false if the key has exceeded
 * `limit` requests within the current `windowMs` window.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  // Try to bump the counter for the current window first.
  const bumped = await prisma.rateLimitBucket.updateMany({
    where: { key, windowStart },
    data: { count: { increment: 1 } },
  });

  if (bumped.count > 0) {
    const bucket = await prisma.rateLimitBucket.findUnique({ where: { key } });
    return (bucket?.count ?? 0) <= limit;
  }

  // No row for the current window yet — either the first request ever for
  // this key, or the previous window has expired. Reset it to count 1.
  await prisma.rateLimitBucket.upsert({
    where: { key },
    create: { key, windowStart, count: 1 },
    update: { windowStart, count: 1 },
  });
  return true;
}
