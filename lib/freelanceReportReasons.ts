// Split out from lib/freelanceReport.ts so the client-side report form can
// import the reason list without pulling Prisma into the browser bundle.
export const FREELANCE_REPORT_REASONS = {
  SCAM: "Scam or fraud",
  SPAM: "Spam or advertising",
  INAPPROPRIATE: "Offensive or inappropriate",
  MISLEADING: "Fake or misleading",
  OTHER: "Something else",
} as const;

export type FreelanceReportReason = keyof typeof FREELANCE_REPORT_REASONS;

export function isFreelanceReportReason(value: string): value is FreelanceReportReason {
  return Object.prototype.hasOwnProperty.call(FREELANCE_REPORT_REASONS, value);
}
