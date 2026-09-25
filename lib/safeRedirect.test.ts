import { describe, expect, it } from "vitest";
import { safeCallbackPath } from "@/lib/safeRedirect";

const origin = "https://scholaraura.com";

describe("safeCallbackPath", () => {
  it("keeps paths on this site", () => {
    expect(safeCallbackPath("/jobs/data-analyst?apply=1", origin)).toBe("/jobs/data-analyst?apply=1");
    expect(safeCallbackPath("https://scholaraura.com/dashboard/job-alerts", origin)).toBe("/dashboard/job-alerts");
  });

  it("never redirects off-site", () => {
    for (const bad of ["https://evil.com/x", "//evil.com", "/\\evil.com", "javascript:alert(1)"]) {
      expect(safeCallbackPath(bad, origin)).toBe("/dashboard");
    }
    expect(safeCallbackPath(null, origin)).toBe("/dashboard");
  });
});
