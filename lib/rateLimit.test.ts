import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../test/prismaMock";
import { checkRateLimit } from "@/lib/rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request for a key and creates its window", async () => {
    prismaMock.rateLimitBucket.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.rateLimitBucket.upsert.mockResolvedValue({} as never);

    await expect(checkRateLimit("test-key", 5, 60_000)).resolves.toBe(true);
    expect(prismaMock.rateLimitBucket.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: "test-key" } })
    );
  });

  it("allows a request that keeps the count at or under the limit", async () => {
    prismaMock.rateLimitBucket.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.rateLimitBucket.findUnique.mockResolvedValue({
      key: "test-key",
      windowStart: new Date(),
      count: 5,
    } as never);

    await expect(checkRateLimit("test-key", 5, 60_000)).resolves.toBe(true);
  });

  it("rejects once the count exceeds the limit within the same window", async () => {
    prismaMock.rateLimitBucket.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.rateLimitBucket.findUnique.mockResolvedValue({
      key: "test-key",
      windowStart: new Date(),
      count: 6,
    } as never);

    await expect(checkRateLimit("test-key", 5, 60_000)).resolves.toBe(false);
  });

  it("resets a key to a fresh window once the previous window has expired", async () => {
    // No row matches the *current* window, even though this key has been
    // seen before (an old window's row still exists under the same key).
    prismaMock.rateLimitBucket.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.rateLimitBucket.upsert.mockResolvedValue({} as never);

    await expect(checkRateLimit("test-key", 5, 60_000)).resolves.toBe(true);
    expect(prismaMock.rateLimitBucket.upsert).toHaveBeenCalledWith({
      where: { key: "test-key" },
      create: { key: "test-key", windowStart: new Date("2026-01-01T00:00:00.000Z"), count: 1 },
      update: { windowStart: new Date("2026-01-01T00:00:00.000Z"), count: 1 },
    });
  });
});
