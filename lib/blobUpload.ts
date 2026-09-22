import { get, del } from "@vercel/blob";

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
