import { withSentryConfig } from "@sentry/nextjs";

// Baseline security headers on every response. No full Content-Security-
// Policy yet: Razorpay, Google sign-in/One Tap, Turnstile, Analytics and the
// Bunny video player all load third-party scripts/frames, so a CSP needs its
// own careful rollout (report-only first).
const securityHeaders = [
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
