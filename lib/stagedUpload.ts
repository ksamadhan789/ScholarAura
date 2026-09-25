import { getSession } from "next-auth/react";

/**
 * Staged (Vercel Blob) uploads live under a per-user folder — see
 * lib/blobUpload.ts. Kept dependency-free apart from next-auth/react so
 * client components can import it.
 */
export function stagedUploadPrefix(userId: string): string {
  return `staging/${userId}/`;
}

/** Client-side: the Blob pathname to upload a file to for the signed-in user. */
export async function stagedUploadPath(fileName: string): Promise<string> {
  const session = await getSession();
  if (!session?.user.id) throw new Error("Please sign in again to upload files.");
  return `${stagedUploadPrefix(session.user.id)}${fileName}`;
}
