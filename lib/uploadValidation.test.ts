import { describe, expect, it } from "vitest";
import { isAllowedUploadType, matchesMagicBytes } from "./uploadValidation";

describe("isAllowedUploadType", () => {
  it("accepts the documented types", () => {
    expect(isAllowedUploadType("application/pdf")).toBe(true);
    expect(isAllowedUploadType("image/png")).toBe(true);
    expect(isAllowedUploadType("application/zip")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isAllowedUploadType("application/x-msdownload")).toBe(false);
    expect(isAllowedUploadType("text/html")).toBe(false);
  });
});

describe("matchesMagicBytes", () => {
  it("accepts bytes matching the declared type's signature", () => {
    expect(matchesMagicBytes("application/pdf", new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 1, 2]))).toBe(true);
    expect(matchesMagicBytes("image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      true
    );
  });

  it("rejects bytes that don't match the declared type's signature", () => {
    expect(matchesMagicBytes("application/pdf", new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
  });

  it("accepts an unrecognized MIME type on the label alone", () => {
    expect(matchesMagicBytes("text/plain", new Uint8Array([1, 2, 3]))).toBe(true);
  });
});
