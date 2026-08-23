import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions } from "@/lib/auth";
import { SITE_URL } from "@/lib/siteUrl";
import { DELEGATED_DRIVE_SCOPES } from "@/lib/google/delegatedAuth";

function safeReturnTo(value: string | null): string {
  // Only ever redirect back within our own site — reject anything that
  // could point off-domain (a leading "//" is parsed as protocol-relative).
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard/events";
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const returnTo = safeReturnTo(new URL(request.url).searchParams.get("returnTo"));

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET,
    `${SITE_URL}/api/admin/google-drive/callback`
  );

  const url = client.generateAuthUrl({
    access_type: "offline",
    // Forces the consent screen (and a fresh refresh_token) even if this
    // admin already granted access before — without it, Google can silently
    // skip straight to the callback with no refresh_token at all.
    prompt: "consent",
    scope: DELEGATED_DRIVE_SCOPES,
    state: returnTo,
  });

  return NextResponse.redirect(url);
}
