import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  const isInstructor = session.user.role === "INSTRUCTOR";

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-semibold">
        👋 Welcome, {session.user?.name ?? session.user?.email}
      </h1>
      <p className="mt-2 text-gray-600 dark:text-slate-400">
        Signed in as <strong>{session.user?.email}</strong> · Role:{" "}
        <strong>{session.user?.role}</strong>
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/courses"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          📚 Browse courses
        </Link>
        <Link
          href="/dashboard/learning"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          🎓 My learning
        </Link>
        {isInstructor && (
          <Link
            href="/dashboard/courses"
            className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
          >
            🧑‍🏫 My courses (instructor)
          </Link>
        )}
        <Link
          href="/events"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          📅 Browse events
        </Link>
        <Link
          href="/dashboard/registrations"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          🗓️ My events
        </Link>
        <Link
          href="/dashboard/certificates"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          📜 My certificates
        </Link>
        <Link
          href="/dashboard/referrals"
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          🎁 Refer & earn
        </Link>
      </div>
    </main>
  );
}
