import { describe, expect, it } from "vitest";
import { httpUrl, isHttpUrl } from "@/lib/safeUrl";

describe("isHttpUrl / httpUrl", () => {
  it("accepts normal web links", () => {
    expect(isHttpUrl("https://example.com/portfolio")).toBe(true);
    expect(httpUrl().safeParse(" http://example.com ").success).toBe(true);
  });

  it("rejects script and data URLs that zod's .url() would accept", () => {
    for (const bad of ["javascript:alert(document.cookie)", "JAVASCRIPT:alert(1)", "data:text/html,<script>x</script>"]) {
      expect(isHttpUrl(bad)).toBe(false);
      expect(httpUrl().safeParse(bad).success).toBe(false);
    }
  });
});
