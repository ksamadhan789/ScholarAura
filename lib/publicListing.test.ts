import { describe, expect, it } from "vitest";
import { toPublicListing } from "@/lib/publicListing";

describe("toPublicListing", () => {
  it("drops the joining link, webhook secret and Google wiring but keeps public fields", () => {
    const row = {
      title: "FDP on AI",
      city: "Pune",
      venueOrLink: "https://zoom.us/j/secret",
      webhookSecret: "s3cret",
      googleFormUrl: "https://forms.gle/x",
      googleSheetId: "sheet",
      googleSlidesTemplateId: "slides",
    };
    expect(toPublicListing(row)).toEqual({ title: "FDP on AI", city: "Pune" });
    expect(row.webhookSecret).toBe("s3cret"); // original untouched
  });
});
