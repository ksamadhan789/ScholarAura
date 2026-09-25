/**
 * Builds a Content-Disposition header that is safe for any filename. Header
 * values must be Latin-1: a raw Hindi name, an emoji or the narrow no-break
 * space in macOS screenshot names made `new Response()` throw (so the file
 * could never be opened), and a raw `"` let an uploader inject extra
 * parameters. Sends an ASCII fallback plus the exact name as RFC 5987
 * `filename*`, which every current browser prefers.
 */
export function contentDisposition(type: "inline" | "attachment", filename: string | null | undefined): string {
  const name = (filename ?? "").trim() || "download";
  const ascii = name
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/["\\]/g, "")
    .trim() || "download";
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
