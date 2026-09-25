/** Cookie that ties a Google Drive OAuth callback to the Connect click that started it. */
export const DRIVE_OAUTH_COOKIE = "drive_oauth_state";

export function readDriveOAuthState(raw: string | undefined): { state: string; returnTo: string } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.state === "string" && typeof parsed?.returnTo === "string" ? parsed : null;
  } catch {
    return null;
  }
}
