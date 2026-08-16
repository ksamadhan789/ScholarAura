import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/google/serviceAccount";

const SHEETS_READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

export type SheetRow = Record<string, string>;

/**
 * Reads a Google Sheet's first row as headers and returns the rest as
 * header-keyed row objects. The sheet must be shared (at least Viewer) with
 * the service account's client_email.
 */
export async function getSheetRows(spreadsheetId: string, range = "A1:Z"): Promise<SheetRow[]> {
  const auth = getGoogleAuth([SHEETS_READONLY_SCOPE]);
  if (!auth) {
    throw new Error(
      "Google service account is not configured — set GOOGLE_SERVICE_ACCOUNT_KEY"
    );
  }

  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const values = res.data.values;
  if (!values || values.length < 2) return [];

  const headers = values[0].map((h) => String(h).trim().toLowerCase());
  return values.slice(1).map((row) => {
    const record: SheetRow = {};
    headers.forEach((header, i) => {
      record[header] = row[i] !== undefined ? String(row[i]).trim() : "";
    });
    return record;
  });
}
