import { findOrCreateFolder, uploadFile, downloadFile, deleteFile } from "@/lib/google/driveService";

/**
 * Uploads a profile photo under Root/profile-photos/{userId}/, mirroring the
 * profile-resumes/{userId}/ layout in profileResumeStorage.ts.
 */
export async function uploadProfilePhoto(
  userId: string,
  fileName: string,
  bytes: Uint8Array,
  mimeType: string
): Promise<string> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured");
  }

  const photosFolderId = await findOrCreateFolder("profile-photos", rootFolderId);
  const userFolderId = await findOrCreateFolder(userId, photosFolderId);
  return uploadFile(fileName, userFolderId, bytes, mimeType);
}

export async function downloadProfilePhoto(fileId: string): Promise<Buffer> {
  return downloadFile(fileId);
}

export async function deleteProfilePhoto(fileId: string): Promise<void> {
  await deleteFile(fileId);
}
