import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudentsAdminPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const query = searchParams.q?.trim() ?? "";

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      organization: true,
      createdAt: true,
      emailVerified: true,
      googleId: true,
      creditBalance: true,
      _count: {
        select: {
          coursePurchases: { where: { status: "SUCCESS" } },
          eventRegistrations: { where: { status: "CONFIRMED" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            {students.length} student{students.length === 1 ? "" : "s"}
            {query ? ` matching "${query}"` : ""}
          </p>
        </div>
        <a
          href={`/api/admin/students/export${query ? `?q=${encodeURIComponent(query)}` : ""}`}
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Export CSV
        </a>
      </div>

      <form className="mb-6">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by name or email"
          className="w-full max-w-sm rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
        />
      </form>

      {students.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {query ? "No students match that search." : "No students have signed up yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Phone</th>
                <th className="px-4 py-2.5 font-medium">Organization</th>
                <th className="px-4 py-2.5 font-medium">Signed up</th>
                <th className="px-4 py-2.5 font-medium">Verified</th>
                <th className="px-4 py-2.5 font-medium">Method</th>
                <th className="px-4 py-2.5 font-medium">Enrollments</th>
                <th className="px-4 py-2.5 font-medium">Credit</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-t border-gray-200 dark:border-slate-700">
                  <td className="px-4 py-2.5">{student.name}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`mailto:${student.email}`} className="underline">
                      {student.email}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                    {student.phone ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                    {student.organization ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                    {student.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    {student.emailVerified ? "✓" : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                    {student.googleId ? "Google" : "Email/Password"}
                  </td>
                  <td className="px-4 py-2.5">
                    {student._count.coursePurchases + student._count.eventRegistrations}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                    ₹{Number(student.creditBalance).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
