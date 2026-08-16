import { google } from "googleapis";

// GOOGLE_SERVICE_ACCOUNT_KEY holds the full service-account JSON key,
// base64-encoded — a raw multi-line JSON value doesn't survive being pasted
// into most env var UIs (including Vercel's) intact.
function loadServiceAccountKey(): { client_email: string; private_key: string } | null {
  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!encoded) return null;

  try {
    const json = Buffer.from(encoded, "base64").toString("utf-8");
    const parsed = JSON.parse(json);
    if (!parsed.client_email || !parsed.private_key) return null;
    return { client_email: parsed.client_email, private_key: parsed.private_key };
  } catch {
    return null;
  }
}

export function getGoogleAuth(scopes: string[]) {
  const key = loadServiceAccountKey();
  if (!key) return null;

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: key.client_email,
      private_key: key.private_key,
    },
    scopes,
  });
}
