import { describe, expect, it } from "vitest";
import {
  getInstructorCommissionRatePercent,
  DEFAULT_INSTRUCTOR_COMMISSION_RATE_PERCENT,
} from "@/lib/instructorPayout";

describe("getInstructorCommissionRatePercent", () => {
  it("uses the site default when the instructor has no custom rate", () => {
    expect(
      getInstructorCommissionRatePercent({ instructorCommissionRatePercent: null })
    ).toBe(DEFAULT_INSTRUCTOR_COMMISSION_RATE_PERCENT);
  });

  it("uses the instructor's custom rate when set", () => {
    expect(getInstructorCommissionRatePercent({ instructorCommissionRatePercent: 85 })).toBe(85);
  });

  it("respects a custom rate of 0", () => {
    expect(getInstructorCommissionRatePercent({ instructorCommissionRatePercent: 0 })).toBe(0);
  });
});
