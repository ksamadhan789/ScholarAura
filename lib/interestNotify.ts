import { prisma } from "@/lib/prisma";
import { sendNewContentMatchingInterestEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/siteUrl";

type ContentKind = "course" | "event" | "competition";

const PATH_BY_KIND: Record<ContentKind, string> = {
  course: "courses",
  event: "events",
  competition: "competitions",
};

/**
 * Called right after a course/event/competition is published. Best-effort —
 * a failure here should never block the publish itself, so every caller
 * wraps this in .catch(). Matches the same title/category "contains" rule
 * the dashboard already uses to recommend courses by field of study.
 */
export async function notifyInterestedStudents(
  kind: ContentKind,
  item: { slug: string; title: string; category?: string | null }
): Promise<void> {
  const haystacks = [item.title, item.category]
    .filter((v): v is string => Boolean(v && v.trim()))
    .map((v) => v.toLowerCase());

  const students = await prisma.user.findMany({
    where: { role: "STUDENT", marketingOptIn: true, fieldOfStudy: { not: null } },
    select: { email: true, name: true, fieldOfStudy: true },
  });

  const matched = students.filter((s) => {
    const field = s.fieldOfStudy!.trim().toLowerCase();
    return field.length > 0 && haystacks.some((h) => h.includes(field));
  });

  if (matched.length === 0) return;

  const url = `${SITE_URL}/${PATH_BY_KIND[kind]}/${item.slug}`;

  await Promise.allSettled(
    matched.map((s) => sendNewContentMatchingInterestEmail(s.email, s.name, kind, item.title, url))
  );
}
