import { findOrCreateFolder, uploadPdf, downloadFile, deleteFile } from "@/lib/google/driveService";

/**
 * Uploads a resume PDF under Root/job-resumes/{job-slug}/, mirroring the
 * Certificates/{year}/{event-slug}/ folder layout used elsewhere. Returns
 * the Drive file ID to store on the JobApplication row.
 */
export async function uploadResume(
  jobSlug: string,
  fileName: string,
  bytes: Uint8Array
): Promise<string> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured");
  }

  const resumesFolderId = await findOrCreateFolder("job-resumes", rootFolderId);
  const jobFolderId = await findOrCreateFolder(jobSlug, resumesFolderId);
  return uploadPdf(fileName, jobFolderId, bytes);
}

export async function downloadResume(fileId: string): Promise<Buffer> {
  return downloadFile(fileId);
}

export async function deleteResume(fileId: string): Promise<void> {
  await deleteFile(fileId);
}
