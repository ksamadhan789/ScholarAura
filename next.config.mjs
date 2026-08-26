import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

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
