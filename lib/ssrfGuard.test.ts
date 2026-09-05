import { describe, expect, it, vi } from "vitest";

vi.mock("dns/promises", () => ({
  default: { lookup: vi.fn() },
}));

import dns from "dns/promises";
import { assertSafeExternalUrl } from "@/lib/ssrfGuard";

describe("assertSafeExternalUrl", () => {
  it("rejects non-http(s) schemes", async () => {
    await expect(assertSafeExternalUrl("file:///etc/passwd")).rejects.toThrow();
  });

  it("rejects a literal loopback IP", async () => {
    await expect(assertSafeExternalUrl("http://127.0.0.1/secret")).rejects.toThrow();
  });

  it("rejects a literal cloud metadata IP", async () => {
    await expect(assertSafeExternalUrl("http://169.254.169.254/latest/meta-data")).rejects.toThrow();
  });

  it("rejects a literal private IPv4 range", async () => {
    await expect(assertSafeExternalUrl("http://10.0.0.5/")).rejects.toThrow();
    await expect(assertSafeExternalUrl("http://192.168.1.1/")).rejects.toThrow();
  });

  it("rejects a literal IPv6 loopback", async () => {
    await expect(assertSafeExternalUrl("http://[::1]/")).rejects.toThrow();
  });

  it("rejects a hostname that resolves to a private address", async () => {
    vi.mocked(dns.lookup).mockResolvedValue([{ address: "169.254.169.254", family: 4 }] as never);
    await expect(assertSafeExternalUrl("http://metadata.internal/")).rejects.toThrow();
  });

  it("allows a hostname that resolves to a public address", async () => {
    vi.mocked(dns.lookup).mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as never);
    await expect(assertSafeExternalUrl("https://example.com/logo.png")).resolves.toBeUndefined();
  });

  it("allows a literal public IP", async () => {
    await expect(assertSafeExternalUrl("http://8.8.8.8/logo.png")).resolves.toBeUndefined();
  });
});
