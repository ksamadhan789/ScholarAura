import {
  findOrCreateFolder,
  downloadFile,
  deleteFile,
  createResumableUploadSession,
} from "@/lib/google/driveService";

async function competitionEntryFolder(competitionSlug: string, userId: string): Promise<string> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured");
  }
  const entryFilesFolderId = await findOrCreateFolder("competition-entry-files", rootFolderId);
  const competitionFolderId = await findOrCreateFolder(competitionSlug, entryFilesFolderId);
  return findOrCreateFolder(userId, competitionFolderId);
}

/**
 * Starts a resumable Drive upload under
 * Root/competition-entry-files/{competition-slug}/{userId}/ and returns the
 * URL the browser uploads the file to directly.
 */
export async function createCompetitionEntryUploadSession(
  competitionSlug: string,
  userId: string,
  fileName: string,
  mimeType: string
): Promise<string> {
  const userFolderId = await competitionEntryFolder(competitionSlug, userId);
  return createResumableUploadSession(fileName, userFolderId, mimeType);
}

export async function downloadCompetitionEntryFile(fileId: string): Promise<Buffer> {
  return downloadFile(fileId);
}

export async function deleteCompetitionEntryFile(fileId: string): Promise<void> {
  await deleteFile(fileId);
}
