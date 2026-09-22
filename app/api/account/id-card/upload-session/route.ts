import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createIdCardUploadSession } from "@/lib/studentIdCardStorage";
import { ALLOWED_UPLOAD_TYPES_LABEL, MAX_UPLOAD_BYTES, isAllowedUploadType } from "@/lib/uploadValidation";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const fileName = typeof body?.fileName === "string" ? body.fileName : null;
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : null;
  const fileSize = typeof body?.fileSize === "number" ? body.fileSize : null;
  if (!fileName || !mimeType || fileSize == null) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!isAllowedUploadType(mimeType)) {
    return NextResponse.json(
      { error: `Your ID card must be one of: ${ALLOWED_UPLOAD_TYPES_LABEL}` },
      { status: 400 }
    );
  }
  if (fileSize > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `Your ID card must be under ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB` },
      { status: 400 }
    );
  }

  try {
    const uploadUrl = await createIdCardUploadSession(session.user.id, fileName, mimeType);
    return NextResponse.json({ uploadUrl });
  } catch (err) {
    console.error("Failed to start ID card upload session:", err);
    return NextResponse.json({ error: "Couldn't start the upload. Please try again." }, { status: 500 });
  }
}
