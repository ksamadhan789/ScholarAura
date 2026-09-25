import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildIcs } from "@/lib/calendarLinks";
import { eventToCalendar } from "@/lib/eventCalendar";
import { SITE_URL } from "@/lib/siteUrl";
import { contentDisposition } from "@/lib/contentDisposition";

// "Apple / other calendar" download for an event — a standard .ics file
// that Apple Calendar, Outlook desktop and most calendar apps open. Public,
// so it never includes the venue / meeting link (see eventToCalendar).
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event || !event.isPublished) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return new NextResponse(buildIcs(eventToCalendar(event, SITE_URL)), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": contentDisposition("attachment", `${event.slug}.ics`),
    },
  });
}
