import { describe, expect, it } from "vitest";
import { formatJobLocation, jobCityWhere } from "@/lib/jobCity";

describe("jobCityWhere", () => {
  it("matches the structured city (any alias) or, for jobs without one, the location text", () => {
    expect(jobCityWhere("Bengaluru")).toEqual({
      OR: [
        { city: { equals: "Bengaluru", mode: "insensitive" } },
        { city: { equals: "Bangalore", mode: "insensitive" } },
        {
          city: null,
          OR: [
            { location: { contains: "Bengaluru", mode: "insensitive" } },
            { location: { contains: "Bangalore", mode: "insensitive" } },
          ],
        },
      ],
    });
  });
});

describe("formatJobLocation", () => {
  it("appends the city only when the location doesn't already name it", () => {
    expect(formatJobLocation({ location: "Whitefield", city: "Bengaluru" })).toBe("Whitefield, Bengaluru");
    expect(formatJobLocation({ location: "Bengaluru, India", city: "Bengaluru" })).toBe("Bengaluru, India");
    expect(formatJobLocation({ location: "Bangalore, India", city: "Bengaluru" })).toBe("Bangalore, India");
    expect(formatJobLocation({ location: "Anywhere", city: null })).toBe("Anywhere");
  });
});
