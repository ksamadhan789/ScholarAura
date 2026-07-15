import crypto from "crypto";

export function getSignedEmbedUrl(videoId: string, expiresInSeconds = 3600): string {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const tokenKey = process.env.BUNNY_STREAM_TOKEN_KEY;

  if (!libraryId || !tokenKey) {
    throw new Error("Bunny Stream is not configured");
  }

  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const hashableBase = `${tokenKey}${videoId}${expires}`;
  const token = crypto.createHash("sha256").update(hashableBase).digest("hex");

  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;
}
