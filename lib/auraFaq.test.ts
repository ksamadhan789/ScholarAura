import { describe, expect, it } from "vitest";
import { matchAuraFaq } from "@/lib/auraFaq";

describe("matchAuraFaq", () => {
  it("matches a query containing a keyword, case-insensitively", () => {
    const result = matchAuraFaq("How do I get a REFUND for my course?");
    expect(result?.href).toBe("/dashboard/registrations");
  });

  it("matches on a substring within a longer keyword phrase", () => {
    const result = matchAuraFaq("what is an internship");
    expect(result?.href).toBe("/jobs?employmentType=INTERNSHIP");
  });

  it("returns null when nothing matches", () => {
    expect(matchAuraFaq("what is the weather today")).toBeNull();
  });

  it("returns the first matching entry when a query could match multiple", () => {
    // "certificate" and "verify" both live on the same entry — this just
    // confirms matching doesn't throw when a query hits multiple keywords
    // on the same entry.
    const result = matchAuraFaq("how do I verify my certificate");
    expect(result?.href).toBe("/verify");
  });
});
