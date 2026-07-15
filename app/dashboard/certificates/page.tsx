import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPE_LABELS } from "@/lib/eventLabels";

export default async function MyCertificatesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const certificates = await prisma.certificate.findMany({
    where: { userId: session.user.id },
    include: { course: true, event: true },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-semibold">My certificates</h1>

      {certificates.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          No certificates yet — finish a course or attend an event to earn one.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-4"
            >
              <div>
                <h2 className="font-medium">
                  {cert.course?.title ?? cert.event?.title}
                  {cert.event && (
                    <span className="ml-1 text-sm text-gray-500 dark:text-slate-400">
                      ({EVENT_TYPE_LABELS[cert.event.type]})
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {cert.certificateNumber} · Issued{" "}
                  {cert.issuedAt.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/verify/${cert.certificateNumber}`}
                  target="_blank"
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  Verify
                </a>
                <a
                  href={cert.pdfUrl}
                  target="_blank"
                  className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-3 py-1.5 text-sm text-white"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
