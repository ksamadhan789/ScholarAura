import { findOrCreateFolder, uploadFile, downloadFile, deleteFile } from "@/lib/google/driveService";

/**
 * Uploads a competition entry file under Root/competition-entry-files/{competition-slug}/{userId}/,
 * mirroring the job-resumes/{job-slug}/ layout in jobResumeStorage.ts.
 */
export async function uploadCompetitionEntryFile(
  competitionSlug: string,
  userId: string,
  fileName: string,
  bytes: Uint8Array,
  mimeType: string
): Promise<string> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured");
  }

  const entryFilesFolderId = await findOrCreateFolder("competition-entry-files", rootFolderId);
  const competitionFolderId = await findOrCreateFolder(competitionSlug, entryFilesFolderId);
  const userFolderId = await findOrCreateFolder(userId, competitionFolderId);
  return uploadFile(fileName, userFolderId, bytes, mimeType);
}

export async function downloadCompetitionEntryFile(fileId: string): Promise<Buffer> {
  return downloadFile(fileId);
}

export async function deleteCompetitionEntryFile(fileId: string): Promise<void> {
  await deleteFile(fileId);
}
