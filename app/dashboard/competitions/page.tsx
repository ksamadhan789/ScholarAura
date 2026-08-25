import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { CompetitionPublishToggle } from "./CompetitionPublishToggle";

export default async function ManageCompetitionsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const competitions = await prisma.competition.findMany({
    orderBy: { startDate: "asc" },
    include: { _count: { select: { entries: { where: { status: "SUCCESS" } } } } },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage competitions</h1>
        <Link
          href="/dashboard/competitions/new"
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white"
        >
          + New competition
        </Link>
      </div>

      {competitions.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">No competitions created yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {competitions.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-4"
            >
              <div>
                <Link href={`/competitions/${c.slug}`} className="font-medium hover:underline">
                  {c.title}
                </Link>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  Submit by{" "}
                  {c.submissionDeadline.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                  <Badge variant={c.isPublished ? "success" : "warning"}>
                    {c.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <span>{c._count.entries} entries</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/competitions/${c.slug}/edit`}
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  Edit
                </Link>
                <Link
                  href={`/dashboard/competitions/${c.slug}/entries`}
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  Entries
                </Link>
                <Link
                  href={`/dashboard/competitions/${c.slug}/winners`}
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  🏆 Winners
                </Link>
                <Link
                  href={`/dashboard/competitions/${c.slug}/certificates`}
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  Certificates
                </Link>
                <CompetitionPublishToggle slug={c.slug} isPublished={c.isPublished} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
