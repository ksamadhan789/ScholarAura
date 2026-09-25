import { describe, expect, it } from "vitest";
import { contentDisposition } from "@/lib/contentDisposition";

describe("contentDisposition", () => {
  it("produces a header value a Response accepts even for non-Latin names", () => {
    for (const name of ["रिज़्यूमे.pdf", "Screenshot 2026-09-25 at 10.00.00 AM.png", "résumé 🎓.pdf"]) {
      const value = contentDisposition("inline", name);
      expect(() => new Response("x", { headers: { "Content-Disposition": value } })).not.toThrow();
      expect(value).toContain(`filename*=UTF-8''${encodeURIComponent(name)}`);
    }
  });

  it("strips quotes so a filename can't inject extra parameters", () => {
    expect(contentDisposition("attachment", 'a"; filename="evil.html')).toMatch(/^attachment; filename="a; filename=evil\.html"; /);
  });

  it("falls back to a generic name", () => {
    expect(contentDisposition("inline", null)).toContain('filename="download"');
    expect(contentDisposition("inline", "简历.pdf")).toContain('filename=".pdf"');
  });
});
