import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteProfilePhoto } from "@/lib/profilePhotoStorage";
import { deleteProfileResume } from "@/lib/profileResumeStorage";
import { deleteStudentIdCard } from "@/lib/studentIdCardStorage";

export class AccountNotFoundError extends Error {
  constructor() {
    super("ACCOUNT_NOT_FOUND");
  }
}

// "Delete account" is a deactivate-and-anonymize, not a hard delete —
// certificates, payment history, job applications and referral credit stay
// in place (other people's records, or things the platform needs to keep
// for its own accounting), only this user's own identifying fields are
// scrubbed and their login disabled. Returns the pre-scrub name/email so
// the caller can still notify an admin about who left and why.
export async function deactivateAccount(
  userId: string,
  reason: string | null
): Promise<{ name: string; email: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AccountNotFoundError();

  await Promise.all([
    user.photoFileId
      ? deleteProfilePhoto(user.photoFileId).catch((err) =>
          console.error(`Failed to delete profile photo ${user.photoFileId} on account deletion:`, err)
        )
      : null,
    user.resumeFileId
      ? deleteProfileResume(user.resumeFileId).catch((err) =>
          console.error(`Failed to delete resume ${user.resumeFileId} on account deletion:`, err)
        )
      : null,
    user.idCardFileId
      ? deleteStudentIdCard(user.idCardFileId).catch((err) =>
          console.error(`Failed to delete ID card ${user.idCardFileId} on account deletion:`, err)
        )
      : null,
  ]);

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: "Deleted user",
      email: `deleted-${userId}@deleted.scholaraura.local`,
      passwordHash: null,
      googleId: null,
      phone: null,
      organization: null,
      firstName: null,
      middleName: null,
      lastName: null,
      fieldOfStudy: null,
      jobRole: null,
      expertise: null,
      linkedinUrl: null,
      bio: null,
      achievements: Prisma.JsonNull,
      resumeFileId: null,
      resumeName: null,
      photoFileId: null,
      photoContentType: null,
      idCardFileId: null,
      idCardFileName: null,
      idCardContentType: null,
      publicProfileEnabled: false,
      referralCode: null,
      deactivatedAt: new Date(),
      deletionReason: reason,
      sessionVersion: { increment: 1 },
    },
  });

  return { name: user.name, email: user.email };
}
