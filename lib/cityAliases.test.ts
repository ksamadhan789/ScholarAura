import { describe, expect, it } from "vitest";
import { canonicalCityName, getCityAliases } from "@/lib/cityAliases";

describe("getCityAliases", () => {
  it("includes the old name when the new one is chosen", () => {
    expect(getCityAliases("Bengaluru")).toEqual(["Bengaluru", "Bangalore"]);
  });

  it("works in the other direction and ignores case", () => {
    expect(getCityAliases("bangalore")).toEqual(["bangalore", "Bengaluru"]);
  });

  it("returns just the city when it has no known aliases", () => {
    expect(getCityAliases("Jaipur")).toEqual(["Jaipur"]);
  });
});

describe("canonicalCityName", () => {
  it("maps an old name to the current one", () => {
    expect(canonicalCityName(" bangalore ")).toBe("Bengaluru");
  });

  it("fixes the case of a curated city", () => {
    expect(canonicalCityName("mumbai")).toBe("Mumbai");
  });

  it("keeps an unknown city as typed, and blanks as null", () => {
    expect(canonicalCityName("Indore")).toBe("Indore");
    expect(canonicalCityName("   ")).toBeNull();
    expect(canonicalCityName(undefined)).toBeNull();
  });
});
