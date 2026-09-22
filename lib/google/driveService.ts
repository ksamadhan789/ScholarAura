import { Readable } from "stream";
import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/google/serviceAccount";
import { getDelegatedGoogleAuth } from "@/lib/google/delegatedAuth";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

// Prefers the connected admin's own Google account (real storage quota)
// over the bare service account (zero quota on a non-Workspace account) —
// see GoogleDriveConnection's schema comment for why.
async function driveClient() {
  const delegated = await getDelegatedGoogleAuth();
  if (delegated) {
    return google.drive({ version: "v3", auth: delegated });
  }
  const auth = getGoogleAuth([DRIVE_SCOPE]);
  if (!auth) {
    throw new Error(
      "Google Drive is not configured — connect a Google account from the certificates page, or set GOOGLE_SERVICE_ACCOUNT_KEY"
    );
  }
  return google.drive({ version: "v3", auth });
}

/**
 * Finds a subfolder by exact name under a parent, creating it if it doesn't
 * exist yet. Used to build the Certificates/{year}/{event-slug}/ layout
 * without ever creating duplicate folders across repeated generation runs.
 */
export async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const drive = await driveClient();
  const escapedName = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  const res = await drive.files.list({
    q: `name = '${escapedName}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    spaces: "drive",
  });
  const existingId = res.data.files?.[0]?.id;
  if (existingId) return existingId;

  const created = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id",
  });
  if (!created.data.id) throw new Error("Failed to create Drive folder");
  return created.data.id;
}

export async function copyFile(fileId: string, name: string, parentId: string): Promise<string> {
  const drive = await driveClient();
  const res = await drive.files.copy({
    fileId,
    requestBody: { name, parents: [parentId] },
    fields: "id",
  });
  if (!res.data.id) throw new Error("Failed to copy Drive file");
  return res.data.id;
}

/** Exports a Google-native file (e.g. a Slides presentation) as a PDF. */
export async function exportAsPdf(fileId: string): Promise<Buffer> {
  const drive = await driveClient();
  const res = await drive.files.export(
    { fileId, mimeType: "application/pdf" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data as ArrayBuffer);
}

export async function uploadFile(
  name: string,
  parentId: string,
  bytes: Uint8Array,
  mimeType: string
): Promise<string> {
  const drive = await driveClient();
  const res = await drive.files.create({
    requestBody: { name, parents: [parentId] },
    media: { mimeType, body: Readable.from(Buffer.from(bytes)) },
    fields: "id",
  });
  if (!res.data.id) throw new Error("Failed to upload file");
  return res.data.id;
}

export async function uploadPdf(name: string, parentId: string, bytes: Uint8Array): Promise<string> {
  return uploadFile(name, parentId, bytes, "application/pdf");
}

/** Downloads the raw bytes of a binary file (as opposed to exporting a Google-native doc). */
export async function downloadFile(fileId: string): Promise<Buffer> {
  const drive = await driveClient();
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data as ArrayBuffer);
}

export async function deleteFile(fileId: string): Promise<void> {
  const drive = await driveClient();
  await drive.files.delete({ fileId });
}

// Same delegated-account-first, service-account-fallback preference as
// driveClient(), but returning a bearer token instead of a drive client —
// needed to hand the browser a URL it can upload to directly, since that
// call is made from the googleapis SDK's HTTP layer under the hood and the
// SDK has no way to hand back a session URL without also doing the upload.
async function driveAccessToken(): Promise<string> {
  const delegated = await getDelegatedGoogleAuth();
  if (delegated) {
    const { token } = await delegated.getAccessToken();
    if (!token) throw new Error("Failed to get a Google access token");
    return token;
  }
  const auth = getGoogleAuth([DRIVE_SCOPE]);
  if (!auth) {
    throw new Error(
      "Google Drive is not configured — connect a Google account from the certificates page, or set GOOGLE_SERVICE_ACCOUNT_KEY"
    );
  }
  const token = await auth.getAccessToken();
  if (!token) throw new Error("Failed to get a Google access token");
  return token;
}

/**
 * Starts a Drive resumable-upload session and returns the one-time session
 * URL the *browser* can PUT the file bytes to directly — Google's resumable
 * upload endpoint supports CORS for exactly this, so the bytes never pass
 * through our own server. Used to accept files larger than what a
 * serverless function's request body can hold (Vercel hard-caps that at
 * ~4.5MB regardless of what our own code checks): only this small
 * metadata-only POST goes through our function, not the file itself.
 */
export async function createResumableUploadSession(
  name: string,
  parentId: string,
  mimeType: string
): Promise<string> {
  const token = await driveAccessToken();
  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType,
      },
      body: JSON.stringify({ name, parents: [parentId] }),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to start a resumable upload session (HTTP ${res.status})`);
  }
  const uploadUrl = res.headers.get("location");
  if (!uploadUrl) {
    throw new Error("Google didn't return a resumable upload URL");
  }
  return uploadUrl;
}
