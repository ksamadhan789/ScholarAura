import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// One-click "Stop this alert" from an email — no login needed; the alert's
// random UUID in the emailed link is the credential, and all it can do is
// pause that one alert. POST-only (the /job-alerts/unsubscribe/[id] page
// submits it) so link scanners that prefetch emailed URLs can't trigger it.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  await prisma.jobAlert.updateMany({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
