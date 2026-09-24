import { describe, expect, it } from "vitest";
import { jobSearchWhere, parseEmploymentType } from "@/lib/jobSearch";

describe("parseEmploymentType", () => {
  it("accepts real types and rejects junk", () => {
    expect(parseEmploymentType("INTERNSHIP")).toBe("INTERNSHIP");
    expect(parseEmploymentType("BOGUS")).toBeNull();
    expect(parseEmploymentType(undefined)).toBeNull();
  });
});

describe("jobSearchWhere", () => {
  it("is empty for no filters", () => {
    expect(jobSearchWhere({})).toEqual({ AND: [] });
  });

  it("combines type, remote, city and text search", () => {
    const where = jobSearchWhere({ query: " data ", employmentType: "INTERNSHIP", remoteOnly: true, city: "Bengaluru" });
    expect(where.employmentType).toBe("INTERNSHIP");
    expect(where.isRemote).toBe(true);
    const and = where.AND as unknown[];
    expect(and).toHaveLength(2);
    expect(JSON.stringify(and[0])).toContain("Bangalore"); // city aliases included
    expect(JSON.stringify(and[1])).toContain('"contains":"data"');
  });

  it("ignores an unknown employment type", () => {
    expect(jobSearchWhere({ employmentType: "BOGUS" })).not.toHaveProperty("employmentType");
  });
});
