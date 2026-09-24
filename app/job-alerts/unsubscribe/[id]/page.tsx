import { prisma } from "@/lib/prisma";
import { describeJobAlert } from "@/lib/jobAlertLabels";
import { UnsubscribeButton } from "./UnsubscribeButton";

export const dynamic = "force-dynamic";

// Landing page for the "Stop this alert" link in job alert emails. Works
// without logging in; the actual pause is a POST from the button, so an
// email scanner prefetching the link can't stop the alert by itself.
export default async function UnsubscribeJobAlertPage({ params }: { params: { id: string } }) {
  const alert = await prisma.jobAlert.findUnique({ where: { id: params.id } });

  return (
    <main className="mx-auto max-w-[640px] px-4 py-20 text-center">
      {!alert ? (
        <>
          <h1 className="text-2xl font-semibold">Alert not found</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">It may already have been deleted.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">Stop this job alert?</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">{describeJobAlert(alert)}</p>
          <div className="mt-6">
            <UnsubscribeButton id={alert.id} alreadyStopped={!alert.isActive} />
          </div>
        </>
      )}
    </main>
  );
}
