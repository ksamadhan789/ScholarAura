import { z } from "zod";
import type { CertificateStatus } from "@prisma/client";

// The name printed on an event/competition certificate. People set it when
// they register/enter and can change it themselves until the certificate is
// made; after that only an admin can (then regenerates the certificate).

export const CERTIFICATE_NAME_MAX = 100;

export const certificateNameBodySchema = z.object({
  name: z.string().trim().min(1, "Enter the name to print").max(CERTIFICATE_NAME_MAX, "That name is too long"),
  /** Admin only: whose name to change. Omitted = the signed-in person's own. */
  userId: z.string().min(1).optional(),
});

const LOCKED: CertificateStatus[] = ["PROCESSING", "GENERATED", "AVAILABLE"];

/** Once a certificate is being made or exists, the person can no longer change the name themselves. */
export function isCertificateNameLocked(status: CertificateStatus | null | undefined): boolean {
  return !!status && LOCKED.includes(status);
}

export const CERTIFICATE_NAME_LOCKED_MESSAGE =
  "Your certificate has already been issued, so the name can't be changed here. Contact support to correct it.";
