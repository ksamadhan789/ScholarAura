import { prisma } from "@/lib/prisma";

/**
 * Whether this user may act as the owner of a job — see its applicants'
 * resumes/photos/emails, message them, change application status. Posting
 * the job isn't enough on its own: a recruiter the admin has since rejected
 * (e.g. flagged as fraudulent) loses access to applicant data immediately.
 * Jobs with no recruiter profile were posted by an admin.
 */
export async function isActiveJobOwner(
  userId: string,
  job: { postedByUserId: string; recruiterProfileId: string | null }
): Promise<boolean> {
  if (userId !== job.postedByUserId) return false;
  if (!job.recruiterProfileId) return true;
  const profile = await prisma.recruiterProfile.findUnique({
    where: { id: job.recruiterProfileId },
    select: { status: true },
  });
  return profile?.status === "APPROVED";
}
