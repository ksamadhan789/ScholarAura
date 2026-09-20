import { findOrCreateFolder, uploadPdf, downloadFile, deleteFile } from "@/lib/google/driveService";

/**
 * Uploads a resume PDF under Root/profile-resumes/{userId}/, mirroring the
 * job-resumes/{job-slug}/ layout in jobResumeStorage.ts. This is the user's
 * standing resume on their profile, separate from any resume attached to a
 * specific job application.
 */
export async function uploadProfileResume(
  userId: string,
  fileName: string,
  bytes: Uint8Array
): Promise<string> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured");
  }

  const resumesFolderId = await findOrCreateFolder("profile-resumes", rootFolderId);
  const userFolderId = await findOrCreateFolder(userId, resumesFolderId);
  return uploadPdf(fileName, userFolderId, bytes);
}

export async function downloadProfileResume(fileId: string): Promise<Buffer> {
  return downloadFile(fileId);
}

export async function deleteProfileResume(fileId: string): Promise<void> {
  await deleteFile(fileId);
}
