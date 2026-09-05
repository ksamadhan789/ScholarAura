import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "QA_ANSWER"
  | "QA_QUESTION"
  | "WAITLIST_SEAT"
  | "JOB_APPLICATION_STATUS"
  | "JOB_APPLICATION_RECEIVED"
  | "JOB_APPLICATION_WITHDRAWN"
  | "RECRUITER_ACCOUNT_STATUS"
  | "JOB_APPROVAL_STATUS"
  | "REFUND_REQUEST_STATUS"
  | "COMPETITION_RESULT";

/**
 * Creates an in-app notification alongside (never instead of) the existing
 * transactional email for the same event. Best-effort — callers wrap this
 * in .catch() so a notification failure can't block the action that
 * triggered it.
 */
export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  url?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      url: params.url,
    },
  });
}
