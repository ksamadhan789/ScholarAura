import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { matchAuraFaq, type FaqEntry } from "@/lib/auraFaq";

const RESULT_LIMIT = 5;

function insensitive(q: string) {
  return { contains: q, mode: Prisma.QueryMode.insensitive };
}

export type AuraResultItem = {
  id: string;
  href: string;
  badge: string;
  title: string;
  subtitle: string;
};

export type AuraResultSection = {
  label: string;
  items: AuraResultItem[];
};

export type AuraResponse = {
  faqAnswer: FaqEntry | null;
  resultSections: AuraResultSection[];
};

/**
 * Shared by the full /aura page and the /api/aura endpoint the floating
 * widget calls — one place for the "canned FAQ first, live search fallback"
 * logic so the two surfaces can't drift apart.
 */
export async function getAuraResponse(q: string): Promise<AuraResponse> {
  const faqAnswer = q ? matchAuraFaq(q) : null;

  // Skip the live search entirely when a canned FAQ answer already matched —
  // it comes with its own direct link, and a title/category search for
  // something like "how do refunds work" wouldn't turn up anything relevant
  // anyway, so there's no reason to spend a DB round trip on it.
  const [courses, events, competitions, jobs, freelance] = q && !faqAnswer
    ? await Promise.all([
        prisma.course.findMany({
          where: {
            isPublished: true,
            OR: [{ title: insensitive(q) }, { category: insensitive(q) }],
          },
          take: RESULT_LIMIT,
          orderBy: { createdAt: "desc" },
        }),
        prisma.event.findMany({
          where: { isPublished: true, OR: [{ title: insensitive(q) }, { shortDescription: insensitive(q) }] },
          take: RESULT_LIMIT,
          orderBy: { startDate: "asc" },
        }),
        prisma.competition.findMany({
          where: { isPublished: true, OR: [{ title: insensitive(q) }, { shortDescription: insensitive(q) }] },
          take: RESULT_LIMIT,
          orderBy: { startDate: "asc" },
        }),
        prisma.job.findMany({
          where: { isPublished: true, OR: [{ title: insensitive(q) }, { companyName: insensitive(q) }] },
          take: RESULT_LIMIT,
          orderBy: { createdAt: "desc" },
        }),
        prisma.freelanceListing.findMany({
          where: { isPublished: true, OR: [{ title: insensitive(q) }, { category: insensitive(q) }] },
          take: RESULT_LIMIT,
          orderBy: { createdAt: "desc" },
        }),
      ])
    : [[], [], [], [], []];

  const resultSections: AuraResultSection[] = [
    {
      label: "📚 Courses",
      items: courses.map((c) => ({
        id: c.id,
        href: `/courses/${c.slug}`,
        badge: c.category,
        title: c.title,
        subtitle: c.description,
      })),
    },
    {
      label: "📅 Events",
      items: events.map((e) => ({
        id: e.id,
        href: `/events/${e.slug}`,
        badge: "Event",
        title: e.title,
        subtitle: e.shortDescription ?? e.description,
      })),
    },
    {
      label: "🏆 Competitions",
      items: competitions.map((c) => ({
        id: c.id,
        href: `/competitions/${c.slug}`,
        badge: "Competition",
        title: c.title,
        subtitle: c.shortDescription ?? c.description,
      })),
    },
    {
      label: "💼 Jobs",
      items: jobs.map((j) => ({
        id: j.id,
        href: `/jobs/${j.slug}`,
        badge: j.employmentType,
        title: `${j.title} at ${j.companyName}`,
        subtitle: j.isRemote ? "Remote" : j.location,
      })),
    },
    {
      label: "🧰 Freelance",
      items: freelance.map((f) => ({
        id: f.id,
        href: `/freelance/${f.slug}`,
        badge: f.category,
        title: f.title,
        subtitle: f.description,
      })),
    },
  ];

  return { faqAnswer, resultSections };
}
