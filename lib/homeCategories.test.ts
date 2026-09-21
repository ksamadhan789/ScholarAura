import { describe, expect, it } from "vitest";
import { HOME_CATEGORIES, HOME_CATEGORY_GROUPS } from "@/lib/homeCategories";

describe("HOME_CATEGORY_GROUPS", () => {
  it("covers every HOME_CATEGORIES id exactly once", () => {
    const allIds = HOME_CATEGORIES.map((c) => c.id);
    const groupedIds = HOME_CATEGORY_GROUPS.flatMap((g) => g.categoryIds);
    expect(new Set(groupedIds).size).toBe(groupedIds.length);
    expect(groupedIds.sort()).toEqual([...allIds].sort());
  });
});
