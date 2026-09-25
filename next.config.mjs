import { withSentryConfig } from "@sentry/nextjs";
import { contentSecurityPolicyHeaders } from "./lib/contentSecurityPolicy.mjs";

// Security headers on every response. The Content-Security-Policy lives in
// lib/contentSecurityPolicy.mjs (with the list of allowed third-party hosts);
// violations are logged by app/api/csp-report.
const securityHeaders = [
  // Baseline CSP enforced; full allowlist report-only until CSP_ENFORCE=true.
  ...contentSecurityPolicyHeaders({
    dev: process.env.NODE_ENV === "development",
    enforce: process.env.CSP_ENFORCE === "true",
  }),
  // Nobody else may put ScholarAura in a frame (clickjacking on admin pages,
  // account deletion, checkout).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Browsers must trust the Content-Type we send for user files.
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Geolocation stays allowed for our own location bar.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  org: "scholaurauracom",
  project: "javascript-nextjs",
  silent: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  // No SENTRY_AUTH_TOKEN configured — skip authenticated source map upload
  // rather than have the build attempt (and warn about) it on every deploy.
  sourcemaps: {
    disable: true,
  },
});
