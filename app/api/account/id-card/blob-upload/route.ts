import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [...ALLOWED_UPLOAD_MIME_TYPES],
        maximumSizeInBytes: MAX_UPLOAD_BYTES,
        addRandomSuffix: true,
      }),
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
