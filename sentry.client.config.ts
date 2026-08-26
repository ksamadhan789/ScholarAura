import * as Sentry from "@sentry/nextjs";

// Only error capturing, no performance tracing — keeps this within Sentry's
// free tier without needing to think about a separate transaction quota.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
});
