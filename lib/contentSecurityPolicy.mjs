// Content-Security-Policy for every page (wired up in next.config.mjs).
// Plain .mjs so next.config.mjs can import it; lib/contentSecurityPolicy.test.ts
// checks the hosts below stay allowed.
//
// What it buys: the browser refuses to run scripts, open frames or send data
// to any host not listed here, blocks <object>/<embed> plugins, stops other
// sites framing ScholarAura, and stops <base>/<form> hijacking — so an
// injected tag can't pull in an attacker's script or post a form elsewhere.
//
// 'unsafe-inline' stays on script-src/style-src: Next.js, next/font and the
// Google Analytics loader emit inline scripts/styles, and nonces would force
// every page to render dynamically. The host allowlist is still the main win.
//
// Rollout: next.config.mjs always *enforces* the baseline policy below (no
// plugins, no framing by other sites, no <base> hijacking, http→https) — none
// of that can break an integration. The full host allowlist is sent as
// Content-Security-Policy-Report-Only until CSP_ENFORCE=true is set in Vercel:
// browsers then report what they *would* block to /api/csp-report without
// blocking it, so a missing host shows up in the logs instead of breaking
// checkout or sign-in. Flip CSP_ENFORCE once the logs are quiet.
//
// Adding a third-party service? Add its hosts to the matching list below.

/** Hosts each third-party integration needs, by directive. */
export const CSP_SOURCES = {
  script: [
    "https://checkout.razorpay.com", // Razorpay checkout (lib/loadRazorpayScript.ts)
    "https://*.razorpay.com",
    "https://accounts.google.com", // Google sign-in / One Tap (components/GoogleOneTap.tsx)
    "https://challenges.cloudflare.com", // Turnstile (components/Turnstile.tsx)
    "https://www.googletagmanager.com", // Google Analytics (@next/third-parties)
    "https://translate.google.com", // Translate widget (components/TranslateWidget.tsx)
    "https://translate.googleapis.com",
    "https://translate-pa.googleapis.com",
    "https://www.gstatic.com",
    "https://vercel.live", // Vercel preview toolbar (preview deployments only)
  ],
  connect: [
    "https://*.razorpay.com",
    "https://accounts.google.com",
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://www.googletagmanager.com",
    "https://*.ingest.sentry.io", // Sentry error reporting
    "https://*.ingest.us.sentry.io",
    "https://*.ingest.de.sentry.io",
    "https://vercel.com", // Vercel Blob client uploads (@vercel/blob/client → vercel.com/api/blob)
    "https://*.blob.vercel-storage.com",
    "https://translate.googleapis.com",
    "https://translate-pa.googleapis.com",
    "https://vercel.live",
    "wss://ws-us3.pusher.com", // vercel.live comments on previews
  ],
  frame: [
    "https://*.razorpay.com", // checkout modal
    "https://accounts.google.com", // One Tap / sign-in button iframes
    "https://challenges.cloudflare.com", // Turnstile widget
    "https://iframe.mediadelivery.net", // Bunny Stream lecture player (lib/bunny.ts)
    "https://translate.google.com",
    "https://translate.googleapis.com",
    "https://vercel.live",
  ],
  style: [
    "https://accounts.google.com", // GIS button styles
    "https://translate.googleapis.com",
    "https://www.gstatic.com",
    "https://fonts.googleapis.com",
  ],
  font: ["https://fonts.gstatic.com", "https://vercel.live"],
};

/**
 * The header value. `dev` adds 'unsafe-eval' (React refresh / webpack
 * eval source maps need it) and allows the local HMR websocket.
 */
export function buildContentSecurityPolicy({ dev = false } = {}) {
  const directives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : []), ...CSP_SOURCES.script],
    "style-src": ["'self'", "'unsafe-inline'", ...CSP_SOURCES.style],
    // Admins and instructors paste thumbnail / logo URLs from anywhere, and
    // Google/Razorpay serve their own images — any https image is allowed.
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:", ...CSP_SOURCES.font],
    "media-src": ["'self'", "blob:", "https:"],
    "connect-src": ["'self'", ...CSP_SOURCES.connect, ...(dev ? ["ws:", "wss:"] : [])],
    "frame-src": ["'self'", ...CSP_SOURCES.frame],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    // Razorpay's fallback redirect flow posts to its own pages.
    "form-action": ["'self'", "https://*.razorpay.com"],
    "frame-ancestors": ["'self'"],
    "report-uri": ["/api/csp-report"],
  };
  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!dev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

/**
 * The always-enforced part: safe for every integration because it restricts
 * only plugins, who may frame us, <base> and mixed content.
 */
export function buildBaselineContentSecurityPolicy() {
  return ["object-src 'none'", "base-uri 'self'", "frame-ancestors 'self'", "upgrade-insecure-requests"].join("; ");
}

/**
 * The CSP response headers: baseline enforced, plus the full policy either
 * enforced (`enforce`) or report-only.
 */
export function contentSecurityPolicyHeaders({ dev = false, enforce = false } = {}) {
  const full = buildContentSecurityPolicy({ dev });
  if (enforce) return [{ key: "Content-Security-Policy", value: full }];
  return [
    // Local dev serves over http, so skip the https upgrade there.
    {
      key: "Content-Security-Policy",
      value: dev
        ? buildBaselineContentSecurityPolicy().replace("; upgrade-insecure-requests", "")
        : buildBaselineContentSecurityPolicy(),
    },
    { key: "Content-Security-Policy-Report-Only", value: full },
  ];
}
