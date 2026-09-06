import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResourceManager } from "@/components/ResourceManager";

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
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Link
        href={`/dashboard/courses/${course.slug}`}
        className="text-sm text-gray-500 hover:underline dark:text-slate-400"
      >
        ← {course.title}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Course resources</h1>
      <ResourceManager slug={course.slug} resources={resources} />
    </main>
  );
}
