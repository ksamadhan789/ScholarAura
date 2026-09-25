import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResourceManager } from "@/components/ResourceManager";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function CourseResourcesPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const course = await prisma.course.findUnique({ where: { slug: params.slug } });
  if (!course) {
    notFound();
  }

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    redirect("/dashboard/courses");
  }

  const resources = await prisma.courseResource.findMany({
    where: { courseId: course.id, courseVideoId: null },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardShell
      narrow
      title="Course resources"
      backHref={`/dashboard/courses/${course.slug}`}
      backLabel={course.title}
    >
      <ResourceManager slug={course.slug} resources={resources} />
    </DashboardShell>
  );
}
