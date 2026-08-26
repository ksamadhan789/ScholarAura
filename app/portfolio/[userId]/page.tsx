import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPE_LABELS } from "@/lib/eventLabels";

// No dynamic API here (mirrors /verify/[code]) so a profile made public
// after being viewed while private doesn't get stuck cached as "not found".
export const dynamic = "force-dynamic";

export default async function PublicPortfolioPage({ params }: { params: { userId: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, name: true, organization: true, publicProfileEnabled: true },
  });

  if (!user || !user.publicProfileEnabled) {
    notFound();
  }

  const certificates = await prisma.certificate.findMany({
    where: { userId: user.id, status: { in: ["AVAILABLE", "GENERATED"] } },
    include: { course: true, event: true, competition: true },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-semibold">{user.name}</h1>
      {user.organization && <p className="mt-1 text-gray-500 dark:text-slate-400">{user.organization}</p>}
      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
        {certificates.length} certificate{certificates.length === 1 ? "" : "s"} earned on ScholarAura
      </p>

      {certificates.length === 0 ? (
        <p className="mt-8 text-gray-500 dark:text-slate-400">No certificates to show yet.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-4"
            >
              <div>
                <h2 className="font-medium">
                  {cert.course?.title ?? cert.event?.title ?? cert.competition?.title}
                  {cert.event && (
                    <span className="ml-1 text-sm text-gray-500 dark:text-slate-400">
                      ({EVENT_TYPE_LABELS[cert.event.type]})
                    </span>
                  )}
                  {cert.competition && (
                    <span className="ml-1 text-sm text-gray-500 dark:text-slate-400">(Competition)</span>
                  )}
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {cert.certificateNumber} · Issued{" "}
                  {cert.issuedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <Link
                href={`/verify/${cert.certificateNumber}`}
                target="_blank"
                className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
              >
                Verify
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
