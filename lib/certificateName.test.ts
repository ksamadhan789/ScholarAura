import { describe, expect, it } from "vitest";
import { certificateNameBodySchema, isCertificateNameLocked } from "./certificateName";

describe("certificate name", () => {
  it("locks once the certificate is being made or exists", () => {
    expect(isCertificateNameLocked(null)).toBe(false);
    expect(isCertificateNameLocked("ELIGIBLE")).toBe(false);
    expect(isCertificateNameLocked("FAILED")).toBe(false);
    expect(isCertificateNameLocked("PROCESSING")).toBe(true);
    expect(isCertificateNameLocked("GENERATED")).toBe(true);
    expect(isCertificateNameLocked("AVAILABLE")).toBe(true);
  });

  it("trims and rejects empty or overlong names", () => {
    expect(certificateNameBodySchema.parse({ name: "  Asha Rao " }).name).toBe("Asha Rao");
    expect(certificateNameBodySchema.safeParse({ name: "   " }).success).toBe(false);
    expect(certificateNameBodySchema.safeParse({ name: "x".repeat(101) }).success).toBe(false);
  });
});
