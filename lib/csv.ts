import { NextResponse } from "next/server";

/**
 * Neutralizes formula injection — a name/organization value that starts with
 * =, +, -, or @ would otherwise be interpreted as a formula by Excel/Sheets
 * when the exported file is opened, letting a malicious profile field run
 * arbitrary formulas (e.g. HYPERLINK/DDE payloads) on whoever opens the CSV.
 */
export function csvEscape(value: string): string {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\n]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
}

export function toCsvResponse(header: string[], rows: string[][], filename: string): NextResponse {
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
