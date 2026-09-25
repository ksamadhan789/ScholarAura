import { describe, expect, it } from "vitest";
import {
  buildBaselineContentSecurityPolicy,
  buildContentSecurityPolicy,
  contentSecurityPolicyHeaders,
} from "@/lib/contentSecurityPolicy.mjs";

function directive(csp: string, name: string): string[] {
  const part = csp.split("; ").find((p) => p.startsWith(`${name} `));
  return part ? part.split(" ").slice(1) : [];
}

describe("buildContentSecurityPolicy", () => {
  const csp = buildContentSecurityPolicy();

  it("keeps the third-party scripts the site depends on", () => {
    const scripts = directive(csp, "script-src");
    for (const host of [
      "https://checkout.razorpay.com",
      "https://accounts.google.com",
      "https://challenges.cloudflare.com",
      "https://www.googletagmanager.com",
      "https://translate.google.com",
    ]) {
      expect(scripts).toContain(host);
    }
  });

  it("allows the payment, sign-in, captcha and video frames", () => {
    const frames = directive(csp, "frame-src");
    expect(frames).toEqual(
      expect.arrayContaining([
        "https://*.razorpay.com",
        "https://accounts.google.com",
        "https://challenges.cloudflare.com",
        "https://iframe.mediadelivery.net",
      ]),
    );
  });

  it("allows Blob uploads, analytics and error reporting", () => {
    const connect = directive(csp, "connect-src");
    expect(connect).toEqual(
      expect.arrayContaining(["https://vercel.com", "https://*.ingest.sentry.io", "https://*.google-analytics.com"]),
    );
  });

  it("locks down plugins, framing and base/form hijacking", () => {
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "frame-ancestors")).toEqual(["'self'"]);
    expect(directive(csp, "base-uri")).toEqual(["'self'"]);
    expect(directive(csp, "default-src")).toEqual(["'self'"]);
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("only allows eval and websockets in development", () => {
    expect(directive(csp, "script-src")).not.toContain("'unsafe-eval'");
    const dev = buildContentSecurityPolicy({ dev: true });
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(directive(dev, "connect-src")).toContain("ws:");
    expect(dev).not.toContain("upgrade-insecure-requests");
  });
});

describe("contentSecurityPolicyHeaders", () => {
  it("enforces only the baseline and reports the full policy by default", () => {
    const headers = contentSecurityPolicyHeaders();
    expect(headers.map((h) => h.key)).toEqual(["Content-Security-Policy", "Content-Security-Policy-Report-Only"]);
    expect(headers[0].value).toBe(buildBaselineContentSecurityPolicy());
    expect(headers[0].value).not.toContain("script-src");
    expect(headers[1].value).toBe(buildContentSecurityPolicy());
  });

  it("enforces the full policy when switched on", () => {
    expect(contentSecurityPolicyHeaders({ enforce: true })).toEqual([
      { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
    ]);
  });

  it("drops the https upgrade in local dev", () => {
    expect(contentSecurityPolicyHeaders({ dev: true })[0].value).not.toContain("upgrade-insecure-requests");
  });
});
