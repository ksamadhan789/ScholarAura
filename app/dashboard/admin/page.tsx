import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-2 text-gray-600 dark:text-slate-400">
        Signed in as <strong>{session.user?.email}</strong>
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard/events"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Manage events
        </Link>
        <Link
          href="/dashboard/students"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Students
        </Link>
        <Link
          href="/dashboard/affiliates"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Manage affiliates
        </Link>
        <Link
          href="/dashboard/currencies"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Currency rates
        </Link>
        <Link
          href="/dashboard/external-courses"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Recommended courses
        </Link>
      </div>
    </main>
  );
}
