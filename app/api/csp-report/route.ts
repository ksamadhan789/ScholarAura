import { NextResponse } from "next/server";

// Browsers POST here when the Content-Security-Policy (lib/contentSecurityPolicy.mjs)
// blocks something. We just log a compact line so blocked third-party hosts
// show up in the Vercel logs — if a real integration starts failing, its host
// needs adding to the policy. Never returns anything useful to the caller.

const MAX_BODY_BYTES = 8 * 1024;

type LegacyReport = {
  "csp-report"?: {
    "document-uri"?: string;
    "blocked-uri"?: string;
    "violated-directive"?: string;
    "effective-directive"?: string;
  };
};

export async function POST(request: Request) {
  try {
    const text = (await request.text()).slice(0, MAX_BODY_BYTES);
    const report = (JSON.parse(text) as LegacyReport)["csp-report"];
    if (report) {
      const directive = report["effective-directive"] ?? report["violated-directive"] ?? "?";
      console.warn(
        `[csp] blocked ${String(report["blocked-uri"] ?? "?").slice(0, 200)} (${directive}) on ${String(
          report["document-uri"] ?? "?",
        ).slice(0, 200)}`,
      );
    }
  } catch {
    // Malformed or oversized report — ignore.
  }
  return new NextResponse(null, { status: 204 });
}
