export function computeEligibility(
  registration: { status: string; attendancePercent: number | null },
  event: { attendanceRequired: boolean; minAttendancePercent: number | null }
): boolean {
  if (registration.status !== "CONFIRMED") return false;
  if (!event.attendanceRequired) return true;
  if (registration.attendancePercent === null) return false;
  return registration.attendancePercent >= (event.minAttendancePercent ?? 0);
}

// Same logic as computeEligibility, but for a CompetitionEntry — whose
// "successfully entered" status is SUCCESS (a PaymentStatus value), not
// CONFIRMED (a RegistrationStatus value).
export function computeCompetitionEligibility(
  entry: { status: string; attendancePercent: number | null },
  competition: { attendanceRequired: boolean; minAttendancePercent: number | null }
): boolean {
  if (entry.status !== "SUCCESS") return false;
  if (!competition.attendanceRequired) return true;
  if (entry.attendancePercent === null) return false;
  return entry.attendancePercent >= (competition.minAttendancePercent ?? 0);
}
