import { describe, expect, it } from "vitest";
import { getCityAliases } from "@/lib/cityAliases";

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
