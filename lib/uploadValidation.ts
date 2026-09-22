// Shared by every "upload a file instead of pasting a link" flow (student ID
// card, competition entry files, ...). One allow-list and one size cap kept
// in one place so every upload route enforces the same rule.
export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
] as const;

// Vercel Functions hard-cap a request body at ~4.5MB, so a file this size or
// larger can never be sent as a normal multipart POST to one of our routes.
// The upload flow works around that with Vercel Blob's client-upload SDK:
// the browser uploads bytes directly to Blob storage (first-party, CORS is
// supported out of the box), then our route only handles the resulting
// blobUrl — a small JSON payload, nowhere near the body-size cap — reads the
// bytes back server-side, and forwards them to Drive as before. That keeps
// this cap a real product decision (max file size we're willing to store)
// instead of a platform limitation.
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ALLOWED_UPLOAD_TYPES_LABEL = "images, PDF, Word or ZIP";

// The client-supplied MIME type is just a label the browser attaches to
// whatever the user picked, so it's checked separately against the file's
// actual leading bytes — the same approach already used for profile resume
// PDFs. Docx is itself a zip container, so it shares the zip signature.
const MAGIC_BYTES: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46, 0x2d]], // %PDF-
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header (full WEBP check would also need bytes 8-11 == "WEBP")
  "application/zip": [[0x50, 0x4b, 0x03, 0x04]],
  "application/x-zip-compressed": [[0x50, 0x4b, 0x03, 0x04]],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [[0x50, 0x4b, 0x03, 0x04]],
  "application/msword": [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
};

export function isAllowedUploadType(mimeType: string): boolean {
  return (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** Returns false only when the type has a known signature that doesn't match — an unrecognized type is accepted on the MIME type alone. */
export function matchesMagicBytes(mimeType: string, bytes: Uint8Array): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return true;
  return signatures.some((sig) => sig.every((byte, i) => bytes[i] === byte));
}
