import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewBundleForm } from "./NewBundleForm";

export default async function NewBundlePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    select: { id: true, title: true, price: true },
    orderBy: { title: "asc" },
  });

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Create a bundle</h1>
      <NewBundleForm courses={courses.map((c) => ({ id: c.id, title: c.title, price: c.price.toString() }))} />
    </main>
  );
}
