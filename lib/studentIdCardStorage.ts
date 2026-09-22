import {
  findOrCreateFolder,
  downloadFile,
  deleteFile,
  createResumableUploadSession,
} from "@/lib/google/driveService";

async function idCardFolder(userId: string): Promise<string> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured");
  }
  const idCardsFolderId = await findOrCreateFolder("student-id-cards", rootFolderId);
  return findOrCreateFolder(userId, idCardsFolderId);
}

/**
 * Starts a resumable Drive upload under Root/student-id-cards/{userId}/ and
 * returns the URL the browser uploads the file to directly.
 */
export async function createIdCardUploadSession(
  userId: string,
  fileName: string,
  mimeType: string
): Promise<string> {
  const userFolderId = await idCardFolder(userId);
  return createResumableUploadSession(fileName, userFolderId, mimeType);
}

export async function downloadStudentIdCard(fileId: string): Promise<Buffer> {
  return downloadFile(fileId);
}

export async function deleteStudentIdCard(fileId: string): Promise<void> {
  await deleteFile(fileId);
}
