/**
 * The page to go to after signing in, taken from a `callbackUrl` query value
 * — only ever a path on this site, so a crafted link can't bounce people to
 * another domain after they sign in. Accepts a relative path ("/jobs/x") or
 * an absolute URL on our own origin (which is what NextAuth's middleware
 * sends); anything else falls back to the dashboard.
 */
export function safeCallbackPath(value: string | null | undefined, origin: string, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return value;
  try {
    const url = new URL(value);
    if (url.origin === origin) return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    // not a URL
  }
  return fallback;
}
