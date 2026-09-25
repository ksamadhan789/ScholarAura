import { afterEach, describe, expect, it } from "vitest";
import { isOwnStagedBlob } from "@/lib/blobUpload";

const token = process.env.BLOB_READ_WRITE_TOKEN;
afterEach(() => {
  process.env.BLOB_READ_WRITE_TOKEN = token;
});

describe("isOwnStagedBlob", () => {
  it("accepts a blob in the caller's own staging folder", () => {
    expect(isOwnStagedBlob("https://abc.private.blob.vercel-storage.com/staging/u1/card-XyZ.pdf", "u1")).toBe(true);
  });

  it("rejects someone else's upload, other hosts and other stores", () => {
    expect(isOwnStagedBlob("https://abc.private.blob.vercel-storage.com/staging/u2/card.pdf", "u1")).toBe(false);
    expect(isOwnStagedBlob("https://abc.private.blob.vercel-storage.com/card.pdf", "u1")).toBe(false);
    expect(isOwnStagedBlob("https://evil.example.com/staging/u1/card.pdf", "u1")).toBe(false);
    expect(isOwnStagedBlob("http://abc.private.blob.vercel-storage.com/staging/u1/card.pdf", "u1")).toBe(false);
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_mystore_secret";
    expect(isOwnStagedBlob("https://otherstore.private.blob.vercel-storage.com/staging/u1/card.pdf", "u1")).toBe(false);
    expect(isOwnStagedBlob("https://mystore.private.blob.vercel-storage.com/staging/u1/card.pdf", "u1")).toBe(true);
  });
});
