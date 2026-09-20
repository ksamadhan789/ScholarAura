import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadProfilePhoto } from "@/lib/profilePhotoStorage";
import { checkRateLimit, CERTIFICATE_VERIFY_ATTEMPT_LIMIT, CERTIFICATE_VERIFY_WINDOW_MS } from "@/lib/rateLimit";

// Public verify page, so same gate as the page itself: not revoked, and the
// same IP rate limit bucket as the page's own lookup (not a separate one) --
// a photo is more sensitive than the name/institution that limit already
// protects, so it must never be fetchable at a higher rate than the page
// allows just because it's a different endpoint.
export async function GET(request: Request, { params }: { params: { code: string } }) {
  const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const withinLimit = await checkRateLimit(
    `verify-cert:${remoteIp ?? "unknown"}`,
    CERTIFICATE_VERIFY_ATTEMPT_LIMIT,
    CERTIFICATE_VERIFY_WINDOW_MS
  );
  if (!withinLimit) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber: params.code },
    include: { user: { select: { photoFileId: true, photoContentType: true } } },
  });
  if (!certificate || certificate.status === "REVOKED") {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }
  if (!certificate.user.photoFileId) {
    return NextResponse.json({ error: "No photo on file" }, { status: 404 });
  }

  try {
    const bytes = await downloadProfilePhoto(certificate.user.photoFileId);
    return new NextResponse(bytes, {
      headers: { "Content-Type": certificate.user.photoContentType ?? "image/jpeg" },
    });
  } catch (err) {
    console.error("Failed to fetch certificate holder photo:", err);
    return NextResponse.json({ error: "Couldn't fetch photo" }, { status: 500 });
  }
}
