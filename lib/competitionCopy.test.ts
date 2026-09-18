import { describe, expect, it } from "vitest";
import { parseThemeTopic } from "./competitionCopy";

describe("parseThemeTopic", () => {
  it("splits a description written with Theme: / Poster Topic: markers", () => {
    const description =
      'State level online handmade poster making competition Theme: "Youth as Health Ambassadors: Creating a Healthier Future" Poster Topic:"Role of Young Pharmacists in Promoting Community Health"';

    const result = parseThemeTopic(description);

    expect(result).toEqual({
      lead: "State level online handmade poster making competition",
      theme: "Youth as Health Ambassadors: Creating a Healthier Future",
      topic: "Role of Young Pharmacists in Promoting Community Health",
    });
  });

  it("returns null for a plain description with no theme/topic markers", () => {
    expect(parseThemeTopic("A regular competition description with no special formatting.")).toBeNull();
  });

  it("returns null when only one of theme/topic is present", () => {
    expect(parseThemeTopic('Some text Theme: "Only a theme, no topic"')).toBeNull();
  });
});
