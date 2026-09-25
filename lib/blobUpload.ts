import { get, del, list } from "@vercel/blob";
import { stagedUploadPrefix } from "@/lib/stagedUpload";

// The browser uploads large files directly to Vercel Blob (bypassing our
// server's ~4.5MB body-size cap), then hands us just the resulting blob URL.
// These helpers pull those bytes back down server-side so the rest of the
// upload pipeline (magic-byte validation, Drive upload) is unchanged — Blob
// is purely temporary staging, not where files end up living.
export async function downloadBlobBytes(blobUrl: string): Promise<Buffer> {
  const result = await get(blobUrl, { access: "private" });
  if (!result || result.statusCode !== 200) {
    throw new Error("Uploaded file could not be found");
  }
  const arrayBuffer = await new Response(result.stream).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteBlob(blobUrl: string): Promise<void> {
  await del(blobUrl);
}

// Every staged upload lives under a per-user folder (stagedUploadPrefix). The
// upload-token routes only issue tokens for that prefix, and the confirm
// routes only accept a blob URL under the caller's own prefix — so nobody can
// make the server fetch (and then delete) someone else's staged ID card or
// entry file, or a blob in another store.
export { stagedUploadPrefix };

function blobStoreId(): string | null {
  const match = process.env.BLOB_READ_WRITE_TOKEN?.match(/^vercel_blob_rw_([A-Za-z0-9]+)_/);
  return match ? match[1].toLowerCase() : null;
}

export function isOwnStagedBlob(blobUrl: string, userId: string): boolean {
  try {
    const url = new URL(blobUrl);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".blob.vercel-storage.com")) return false;
    const storeId = blobStoreId();
    if (storeId && !url.hostname.startsWith(`${storeId}.`)) return false;
    return decodeURIComponent(url.pathname).startsWith(`/${stagedUploadPrefix(userId)}`);
  } catch {
    return false;
  }
}

const STALE_STAGED_BLOB_MS = 24 * 60 * 60 * 1000;

/**
 * Deletes staged uploads older than a day — ones the browser uploaded but
 * never confirmed (tab closed, validation failed on a flaky connection…).
 * The Blob store is staging-only (real files live in Drive), so anything
 * that old is garbage. Runs from the daily cron.
 */
export async function deleteStaleStagedBlobs(now = new Date()): Promise<number> {
  let deleted = 0;
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 1000 });
    const stale = page.blobs.filter((b) => now.getTime() - new Date(b.uploadedAt).getTime() > STALE_STAGED_BLOB_MS);
    if (stale.length > 0) {
      await del(stale.map((b) => b.url));
      deleted += stale.length;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return deleted;
}
