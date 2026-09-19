import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { matchAuraFaq, type FaqEntry } from "@/lib/auraFaq";

const RESULT_LIMIT = 5;

function insensitive(q: string) {
  return { contains: q, mode: Prisma.QueryMode.insensitive };
}

// Filler words that carry no search meaning on their own — stripping them
// turns a natural question like "how do I find a react course" into the
// actual search terms ("react", "course") instead of matching the whole
// sentence as one literal substring, which almost never hits a real title.
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "do", "does", "did", "how",
  "what", "when", "where", "why", "who", "can", "could", "should", "would",
  "i", "im", "you", "your", "me", "my", "for", "of", "in", "on", "at", "to",
  "and", "or", "find", "get", "looking", "want", "need", "please", "help",
  "show", "tell", "about", "with", "that", "this", "some", "any", "there",
  "have", "has", "give", "list",
]);

/** Splits a query into its meaningful search words, dropping filler words. Falls back to the raw words if every word happens to be a filler (e.g. "how do I"), so a query never ends up searching for nothing. */
export function extractSearchTerms(query: string): string[] {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const meaningful = words.filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return meaningful.length > 0 ? meaningful : words;
}

function anyTermIn(terms: string[], ...fields: string[]) {
  return terms.flatMap((term) => fields.map((field) => ({ [field]: insensitive(term) })));
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
  const terms = q ? extractSearchTerms(q) : [];

  // Skip the live search entirely when a canned FAQ answer already matched —
  // it comes with its own direct link, and a title/category search for
  // something like "how do refunds work" wouldn't turn up anything relevant
  // anyway, so there's no reason to spend a DB round trip on it.
  const [courses, events, competitions, jobs, freelance] = terms.length > 0 && !faqAnswer
    ? await Promise.all([
        prisma.course.findMany({
          where: { isPublished: true, OR: anyTermIn(terms, "title", "category") },
          take: RESULT_LIMIT,
          orderBy: { createdAt: "desc" },
        }),
        prisma.event.findMany({
          where: { isPublished: true, OR: anyTermIn(terms, "title", "shortDescription") },
          take: RESULT_LIMIT,
          orderBy: { startDate: "asc" },
        }),
        prisma.competition.findMany({
          where: { isPublished: true, OR: anyTermIn(terms, "title", "shortDescription") },
          take: RESULT_LIMIT,
          orderBy: { startDate: "asc" },
        }),
        prisma.job.findMany({
          where: { isPublished: true, OR: anyTermIn(terms, "title", "companyName") },
          take: RESULT_LIMIT,
          orderBy: { createdAt: "desc" },
        }),
        prisma.freelanceListing.findMany({
          where: { isPublished: true, OR: anyTermIn(terms, "title", "category") },
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
