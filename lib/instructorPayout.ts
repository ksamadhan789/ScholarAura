export const DEFAULT_INSTRUCTOR_COMMISSION_RATE_PERCENT = 70;

export function getInstructorCommissionRatePercent(instructor: {
  instructorCommissionRatePercent: number | null;
}): number {
  return instructor.instructorCommissionRatePercent ?? DEFAULT_INSTRUCTOR_COMMISSION_RATE_PERCENT;
}
