import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export const DRIVE_CONNECTION_ID = "drive-connection";

export const DELEGATED_DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/presentations",
  "openid",
  "email",
];

/**
 * Returns an OAuth2 client authorized as the connected admin's own Google
 * account, or null if none is connected. Used to create/copy Drive files
 * under a real account's storage quota — a bare service account has none on
 * a non-Workspace account, so this is preferred over it wherever a file
 * actually needs to be written, not just read.
 */
export async function getDelegatedGoogleAuth() {
  const connection = await prisma.googleDriveConnection.findUnique({
    where: { id: DRIVE_CONNECTION_ID },
  });
  if (!connection) return null;

  const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  client.setCredentials({ refresh_token: connection.refreshToken });
  return client;
}

export async function getConnectedGoogleEmail(): Promise<string | null> {
  const connection = await prisma.googleDriveConnection.findUnique({
    where: { id: DRIVE_CONNECTION_ID },
    select: { googleEmail: true },
  });
  return connection?.googleEmail ?? null;
}
