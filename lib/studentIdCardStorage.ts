import { findOrCreateFolder, uploadFile, downloadFile, deleteFile } from "@/lib/google/driveService";

/**
 * Uploads a student ID card under Root/student-id-cards/{userId}/, mirroring
 * the profile-resumes/{userId}/ layout in profileResumeStorage.ts. Uploaded
 * once on the student's profile and reused for every competition they enter.
 */
export async function uploadStudentIdCard(
  userId: string,
  fileName: string,
  bytes: Uint8Array,
  mimeType: string
): Promise<string> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured");
  }

  const idCardsFolderId = await findOrCreateFolder("student-id-cards", rootFolderId);
  const userFolderId = await findOrCreateFolder(userId, idCardsFolderId);
  return uploadFile(fileName, userFolderId, bytes, mimeType);
}

export async function downloadStudentIdCard(fileId: string): Promise<Buffer> {
  return downloadFile(fileId);
}

export async function deleteStudentIdCard(fileId: string): Promise<void> {
  await deleteFile(fileId);
}
