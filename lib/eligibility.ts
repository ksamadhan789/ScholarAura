export function computeEligibility(
  registration: { status: string; attendancePercent: number | null },
  event: { attendanceRequired: boolean; minAttendancePercent: number | null }
): boolean {
  if (registration.status !== "CONFIRMED") return false;
  if (!event.attendanceRequired) return true;
  if (registration.attendancePercent === null) return false;
  return registration.attendancePercent >= (event.minAttendancePercent ?? 0);
}
