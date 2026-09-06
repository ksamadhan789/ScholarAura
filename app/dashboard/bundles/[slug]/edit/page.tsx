import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditBundleForm } from "./EditBundleForm";

export default async function EditBundlePage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const bundle = await prisma.courseBundle.findUnique({
    where: { slug: params.slug },
    include: { items: { orderBy: { orderIndex: "asc" }, select: { courseId: true } } },
  });
  if (!bundle) {
    notFound();
  }

  const existingCourseIds = bundle.items.map((item) => item.courseId);

  // Include any course already in the bundle even if it's since been
  // unpublished, so it doesn't silently disappear from the picker.
  const courses = await prisma.course.findMany({
    where: { OR: [{ isPublished: true }, { id: { in: existingCourseIds } }] },
    select: { id: true, title: true, price: true },
    orderBy: { title: "asc" },
  });

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Edit bundle</h1>
      <EditBundleForm
        slug={bundle.slug}
        courses={courses.map((c) => ({ id: c.id, title: c.title, price: c.price.toString() }))}
        initial={{
          title: bundle.title,
          description: bundle.description,
          price: bundle.price.toString(),
          thumbnailUrl: bundle.thumbnailUrl ?? "",
          isPublished: bundle.isPublished,
          courseIds: existingCourseIds,
        }}
      />
    </main>
  );
}
