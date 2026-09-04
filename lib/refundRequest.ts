import { prisma } from "@/lib/prisma";
import {
  refundCoursePurchase,
  refundEventRegistration,
  refundCompetitionEntry,
  AlreadyRefundedError,
  NotRefundableError,
} from "@/lib/refund";

export { AlreadyRefundedError, NotRefundableError };

export type RefundRequestKind = "course" | "event" | "competition";

export class AlreadyRequestedError extends Error {
  constructor() {
    super("ALREADY_REQUESTED");
  }
}
export class NotEligibleError extends Error {
  constructor() {
    super("NOT_ELIGIBLE");
  }
}
export class RequestNotFoundError extends Error {
  constructor() {
    super("REQUEST_NOT_FOUND");
  }
}

/**
 * Creates a pending refund request for a student's own purchase — validates
 * ownership, that the purchase actually succeeded and cost something (free
 * items have nothing to refund), and that there isn't already a pending
 * request for the same item.
 */
export async function createRefundRequest(params: {
  userId: string;
  kind: RefundRequestKind;
  itemId: string;
  reason: string;
}) {
  const { userId, kind, itemId, reason } = params;

  if (kind === "course") {
    const purchase = await prisma.coursePurchase.findUnique({ where: { id: itemId } });
    if (!purchase || purchase.userId !== userId || purchase.status !== "SUCCESS" || Number(purchase.amount) <= 0) {
      throw new NotEligibleError();
    }
    const existing = await prisma.refundRequest.findFirst({
      where: { coursePurchaseId: itemId, status: "PENDING" },
    });
    if (existing) throw new AlreadyRequestedError();
    return prisma.refundRequest.create({ data: { userId, coursePurchaseId: itemId, reason } });
  }

  if (kind === "event") {
    const registration = await prisma.eventRegistration.findUnique({ where: { id: itemId } });
    if (
      !registration ||
      registration.userId !== userId ||
      registration.status !== "CONFIRMED" ||
      Number(registration.amount) <= 0
    ) {
      throw new NotEligibleError();
    }
    const existing = await prisma.refundRequest.findFirst({
      where: { eventRegistrationId: itemId, status: "PENDING" },
    });
    if (existing) throw new AlreadyRequestedError();
    return prisma.refundRequest.create({ data: { userId, eventRegistrationId: itemId, reason } });
  }

  const entry = await prisma.competitionEntry.findUnique({ where: { id: itemId } });
  if (!entry || entry.userId !== userId || entry.status !== "SUCCESS" || Number(entry.amount) <= 0) {
    throw new NotEligibleError();
  }
  const existing = await prisma.refundRequest.findFirst({
    where: { competitionEntryId: itemId, status: "PENDING" },
  });
  if (existing) throw new AlreadyRequestedError();
  return prisma.refundRequest.create({ data: { userId, competitionEntryId: itemId, reason } });
}

type ResolvedRequestInfo = {
  userId: string;
  userEmail: string;
  userName: string;
  itemTitle: string;
  itemUrl: string;
};

async function loadRequestInfo(requestId: string) {
  const request = await prisma.refundRequest.findUnique({
    where: { id: requestId },
    include: {
      user: true,
      coursePurchase: { include: { course: true } },
      eventRegistration: { include: { event: true } },
      competitionEntry: { include: { competition: true } },
    },
  });
  if (!request) throw new RequestNotFoundError();

  const info: ResolvedRequestInfo = request.coursePurchase
    ? {
        userId: request.userId,
        userEmail: request.user.email,
        userName: request.user.name,
        itemTitle: request.coursePurchase.course.title,
        itemUrl: `/courses/${request.coursePurchase.course.slug}`,
      }
    : request.eventRegistration
      ? {
          userId: request.userId,
          userEmail: request.user.email,
          userName: request.user.name,
          itemTitle: request.eventRegistration.event.title,
          itemUrl: `/events/${request.eventRegistration.event.slug}`,
        }
      : {
          userId: request.userId,
          userEmail: request.user.email,
          userName: request.user.name,
          itemTitle: request.competitionEntry!.competition.title,
          itemUrl: `/competitions/${request.competitionEntry!.competition.slug}`,
        };

  return { request, info };
}

/**
 * Approves a pending refund request: actually issues the refund via the
 * existing admin refund* functions, then marks the request APPROVED. If the
 * underlying refund fails (already refunded, race with an admin manual
 * refund, etc.) the request is left PENDING so it can be retried or
 * rejected instead.
 */
export async function approveRefundRequest(requestId: string) {
  const { request, info } = await loadRequestInfo(requestId);
  if (request.status !== "PENDING") throw new RequestNotFoundError();

  if (request.coursePurchaseId) {
    await refundCoursePurchase(request.coursePurchaseId);
  } else if (request.eventRegistrationId) {
    await refundEventRegistration(request.eventRegistrationId);
  } else {
    await refundCompetitionEntry(request.competitionEntryId!);
  }

  await prisma.refundRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED", resolvedAt: new Date() },
  });

  return info;
}

export async function rejectRefundRequest(requestId: string, rejectionReason: string | null) {
  const { request, info } = await loadRequestInfo(requestId);
  if (request.status !== "PENDING") throw new RequestNotFoundError();

  await prisma.refundRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", rejectionReason, resolvedAt: new Date() },
  });

  return info;
}
