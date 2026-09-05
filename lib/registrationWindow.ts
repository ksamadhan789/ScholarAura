/**
 * registrationStartDate/registrationDeadline are admin-set fields shown on
 * the public event/competition page as real promises ("Registration
 * deadline: ..."), but nothing enforced them server-side — a user could
 * register before the window opened, after the stated deadline, or (when no
 * deadline was set) long after the event/competition had already ended.
 * Centralized here so every registration/checkout entry point applies the
 * same rule.
 */
export function registrationWindowError(
  kind: "event" | "competition",
  window: {
    registrationStartDate: Date | null;
    registrationDeadline: Date | null;
    endDate: Date;
  }
): string | null {
  const now = new Date();
  if (window.registrationStartDate && now < window.registrationStartDate) {
    return `Registration for this ${kind} hasn't opened yet.`;
  }
  if (window.registrationDeadline) {
    if (now > window.registrationDeadline) {
      return `Registration for this ${kind} has closed.`;
    }
  } else if (now > window.endDate) {
    return `This ${kind} has already ended.`;
  }
  return null;
}
