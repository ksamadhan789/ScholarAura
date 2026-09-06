import { findOrCreateFolder, uploadFile, downloadFile, deleteFile } from "@/lib/google/driveService";

/**
 * Uploads a course resource under Root/course-resources/{course-slug}/,
 * mirroring the job-resumes/{job-slug}/ folder layout used elsewhere.
 * Returns the Drive file ID to store on the CourseResource row.
 */
export async function uploadCourseResource(
  courseSlug: string,
  fileName: string,
  mimeType: string,
  bytes: Uint8Array
): Promise<string> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured");
  }

  const resourcesFolderId = await findOrCreateFolder("course-resources", rootFolderId);
  const courseFolderId = await findOrCreateFolder(courseSlug, resourcesFolderId);
  return uploadFile(fileName, courseFolderId, bytes, mimeType);
}

export async function downloadCourseResource(fileId: string): Promise<Buffer> {
  return downloadFile(fileId);
}

export async function deleteCourseResource(fileId: string): Promise<void> {
  await deleteFile(fileId);
}
