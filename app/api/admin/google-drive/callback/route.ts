import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/siteUrl";
import { DRIVE_CONNECTION_ID } from "@/lib/google/delegatedAuth";

function safeReturnTo(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard/events";
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const url = new URL(request.url);
  const returnTo = safeReturnTo(url.searchParams.get("state"));

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.redirect(`${SITE_URL}/dashboard`);
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${SITE_URL}${returnTo}?driveError=missing_code`);
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${SITE_URL}/api/admin/google-drive/callback`
  );

  try {
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token || !tokens.id_token) {
      // Can happen if Google decides to skip issuing a fresh refresh_token
      // despite prompt=consent — the fix is revoking this app's access at
      // myaccount.google.com/permissions and reconnecting.
      return NextResponse.redirect(`${SITE_URL}${returnTo}?driveError=no_refresh_token`);
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const email = ticket.getPayload()?.email;
    if (!email) {
      return NextResponse.redirect(`${SITE_URL}${returnTo}?driveError=no_email`);
    }

    await prisma.googleDriveConnection.upsert({
      where: { id: DRIVE_CONNECTION_ID },
      create: { id: DRIVE_CONNECTION_ID, googleEmail: email, refreshToken: tokens.refresh_token },
      update: { googleEmail: email, refreshToken: tokens.refresh_token },
    });

    return NextResponse.redirect(`${SITE_URL}${returnTo}?driveConnected=1`);
  } catch (err) {
    console.error("Google Drive OAuth callback failed:", err);
    return NextResponse.redirect(`${SITE_URL}${returnTo}?driveError=exchange_failed`);
  }
}
