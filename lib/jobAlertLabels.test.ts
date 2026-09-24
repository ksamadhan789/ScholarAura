import { describe, expect, it } from "vitest";
import { describeJobAlert, jobAlertSearchPath } from "@/lib/jobAlertLabels";

const none = { query: null, employmentType: null, remoteOnly: false, city: null };

describe("describeJobAlert", () => {
  it("names an unfiltered alert", () => {
    expect(describeJobAlert(none)).toBe("All jobs");
  });

  it("lists every filter", () => {
    expect(
      describeJobAlert({ query: "data", employmentType: "INTERNSHIP", remoteOnly: true, city: "Pune" })
    ).toBe('Internship jobs · Remote · Pune · matching "data"');
  });
});

describe("jobAlertSearchPath", () => {
  it("rebuilds the /jobs URL, with an explicit empty city for 'any location'", () => {
    expect(jobAlertSearchPath(none)).toBe("/jobs?city=");
    expect(jobAlertSearchPath({ query: "ml ops", employmentType: "FULL_TIME", remoteOnly: true, city: "Pune" })).toBe(
      "/jobs?q=ml+ops&employmentType=FULL_TIME&remote=true&city=Pune"
    );
  });
});
