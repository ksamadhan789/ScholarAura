import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "REFUND_ISSUED"
  | "REFUND_REQUEST_APPROVED"
  | "REFUND_REQUEST_REJECTED"
  | "RECRUITER_APPROVED"
  | "RECRUITER_REJECTED"
  | "JOB_APPROVED"
  | "JOB_REJECTED";

export type AuditTargetType =
  | "CoursePurchase"
  | "EventRegistration"
  | "CompetitionEntry"
  | "RefundRequest"
  | "RecruiterProfile"
  | "Job";

/**
 * Best-effort, like the email/notification side effects it sits alongside —
 * a logging failure shouldn't roll back or block the admin action itself.
 */
export async function logAdminAction(params: {
  actorId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata,
      },
    });
  } catch (err) {
    console.error(`Failed to record audit log entry for ${params.action} on ${params.targetType} ${params.targetId}:`, err);
  }
}
