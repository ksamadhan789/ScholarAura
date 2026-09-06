import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadCourseResource } from "@/lib/courseResourceStorage";

const MAX_RESOURCE_BYTES = 4 * 1024 * 1024; // stay under Vercel's serverless request body limit
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
]);

async function authorize(slug: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: "You must be logged in" }, { status: 401 }) };
  }

  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) {
    return { error: NextResponse.json({ error: "Course not found" }, { status: 404 }) };
  }

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  }

  return { course };
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const auth = await authorize(params.slug);
  if (auth.error) return auth.error;

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form submission" }, { status: 400 });
  }

  const file = formData.get("file");
  const title = formData.get("title");
  const videoId = formData.get("videoId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Please attach a file" }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "That file type isn't supported" }, { status: 400 });
  }
  if (file.size > MAX_RESOURCE_BYTES) {
    return NextResponse.json({ error: "File must be under 4MB" }, { status: 400 });
  }

  let courseVideoId: string | null = null;
  if (typeof videoId === "string" && videoId) {
    const video = await prisma.courseVideo.findUnique({ where: { id: videoId } });
    if (!video || video.courseId !== auth.course.id) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }
    courseVideoId = video.id;
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const fileId = await uploadCourseResource(auth.course.slug, file.name, file.type, bytes);

    const resource = await prisma.courseResource.create({
      data: {
        courseId: auth.course.id,
        courseVideoId,
        title: title.trim(),
        fileId,
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
      },
    });
    return NextResponse.json(resource, { status: 201 });
  } catch (err) {
    console.error("Failed to upload course resource:", err);
    return NextResponse.json({ error: "Couldn't upload this file. Please try again." }, { status: 500 });
  }
}
