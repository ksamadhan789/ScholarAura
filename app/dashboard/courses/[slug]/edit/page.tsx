import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditCourseForm } from "./EditCourseForm";

export default async function EditCoursePage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const course = await prisma.course.findUnique({ where: { slug: params.slug } });
  if (!course) notFound();

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    redirect("/dashboard/courses");
  }

  return (
    <EditCourseForm
      slug={course.slug}
      initial={{
        title: course.title,
        description: course.description,
        category: course.category,
        price: course.price.toString(),
        thumbnailUrl: course.thumbnailUrl ?? "",
        certificateLogoUrl: course.certificateLogoUrl ?? "",
      }}
    />
  );
}
