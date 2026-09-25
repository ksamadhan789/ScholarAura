import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { stagedUploadPrefix } from "@/lib/blobUpload";
import { checkRateLimit } from "@/lib/rateLimit";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { authOptions } from "@/lib/auth";
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/lib/uploadValidation";

// Issues a short-lived client token so the browser can upload the ID card
// straight to Vercel Blob, then POST the resulting blob URL to
// /api/account/id-card to have it validated and forwarded to Drive.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  // Each token allows a 25MB upload to our storage — cap how many one account can get.
  const userId = session.user.id;
  if (!(await checkRateLimit(`blob-upload:${userId}`, 20, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many uploads. Please try again later." }, { status: 429 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Only into this user's own staging folder (see lib/blobUpload.ts).
        if (!pathname.startsWith(stagedUploadPrefix(userId))) throw new Error("Invalid upload path");
        return {
          allowedContentTypes: [...ALLOWED_UPLOAD_MIME_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("ID card blob upload token request failed:", err);
    return NextResponse.json(
      { error: "Couldn't start the upload. Please try again." },
      { status: 400 }
    );
  }
}
