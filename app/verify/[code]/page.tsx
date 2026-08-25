import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPE_LABELS } from "@/lib/eventLabels";

// No dynamic API (cookies/searchParams/getServerSession) here to naturally
// opt this out of caching, so without this a certificate code checked before
// it's issued could get cached as "Not found" indefinitely.
export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({
  params,
}: {
  params: { code: string };
}) {
  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber: params.code },
    include: { user: true, course: true, event: true, competition: true },
  });
  const isRevoked = certificate?.status === "REVOKED";

  return (
    <main className="mx-auto flex flex-1 w-full max-w-md flex-col justify-center px-4">
      <p className="mb-1 text-sm text-gray-500 dark:text-slate-400">Certificate number</p>
      <p className="mb-6 font-mono text-lg">{params.code}</p>

      {certificate && !isRevoked ? (
        <div className="rounded border border-green-300 bg-green-50 dark:bg-green-900/40 p-5">
          <p className="mb-4 text-lg font-semibold text-green-800 dark:text-green-300">✓ Valid certificate</p>
          <dl className="flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-slate-400">Issued to</dt>
              <dd className="font-medium">{certificate.user.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-slate-400">For</dt>
              <dd className="font-medium">
                {certificate.course?.title ?? certificate.event?.title ?? certificate.competition?.title}
                {certificate.event && (
                  <span className="ml-1 text-gray-500 dark:text-slate-400">
                    ({EVENT_TYPE_LABELS[certificate.event.type]})
                  </span>
                )}
                {certificate.competition && (
                  <span className="ml-1 text-gray-500 dark:text-slate-400">(Competition)</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-slate-400">Issued on</dt>
              <dd className="font-medium">
                {certificate.issuedAt.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
            {(certificate.event || certificate.competition) && certificate.certificateType && (
              <div>
                <dt className="text-gray-500 dark:text-slate-400">Certificate type</dt>
                <dd className="font-medium">
                  {certificate.certificateType.charAt(0) + certificate.certificateType.slice(1).toLowerCase()}
                </dd>
              </div>
            )}
            {(certificate.event || certificate.competition) && certificate.user.organization && (
              <div>
                <dt className="text-gray-500 dark:text-slate-400">Institution</dt>
                <dd className="font-medium">{certificate.user.organization}</dd>
              </div>
            )}
          </dl>

          <a
            href={`/api/certificates/${certificate.certificateNumber}/pdf`}
            target="_blank"
            className="mt-5 inline-block rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white"
          >
            View certificate PDF
          </a>
        </div>
      ) : (
        <div className="rounded border border-red-300 bg-red-50 p-5 dark:border-red-700 dark:bg-red-900/30">
          <p className="text-lg font-semibold text-red-800 dark:text-red-300">
            ✗ {isRevoked ? "Revoked" : "Not found"}
          </p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {isRevoked
              ? "This certificate has been revoked and is no longer valid."
              : "No certificate matches this number. Double-check it was typed correctly."}
          </p>
        </div>
      )}

      <Link href="/verify" className="mt-6 text-sm text-gray-500 dark:text-slate-400 hover:underline">
        Verify another certificate
      </Link>
    </main>
  );
}
