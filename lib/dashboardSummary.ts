// Pure helpers for the learner dashboard (app/dashboard/page.tsx). No
// database access here, so they're safe to unit-test and import anywhere.

const IST_TIME_ZONE = "Asia/Kolkata";

/** "Good morning" / "Good afternoon" / "Good evening" by the hour in India, not the server's UTC clock. */
export function istGreeting(date: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: IST_TIME_ZONE,
      hour: "numeric",
      hourCycle: "h23",
    }).format(date),
  );
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

/** First word of a display name, or the part before "@" when all we have is an email. */
export function firstNameOf(nameOrEmail: string): string {
  const trimmed = nameOrEmail.trim();
  if (!trimmed) return "there";
  if (!trimmed.includes(" ") && trimmed.includes("@")) return trimmed.split("@")[0];
  return trimmed.split(/\s+/)[0];
}

export type CourseProgressSummary = {
  completed: number;
  total: number;
  percent: number;
  isComplete: boolean;
  /** The first lecture not yet completed (or the first lecture, to review a finished course). */
  nextVideoId: string | null;
  actionLabel: "Start" | "Continue" | "Review";
};

/** Progress through one course — `videos` must already be in lecture order. */
export function summarizeCourseProgress(
  videos: { id: string }[],
  completedVideoIds: Set<string>,
): CourseProgressSummary {
  const total = videos.length;
  const completed = videos.filter((v) => completedVideoIds.has(v.id)).length;
  const isComplete = total > 0 && completed === total;
  const next = videos.find((v) => !completedVideoIds.has(v.id)) ?? videos[0] ?? null;
  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    isComplete,
    nextVideoId: next?.id ?? null,
    actionLabel: isComplete ? "Review" : completed > 0 ? "Continue" : "Start",
  };
}

/**
 * The courses worth a "Continue learning" card: unfinished ones that have
 * lectures, those already started first (keeping the caller's order —
 * newest purchase first — within each group).
 */
export function pickContinueLearning<T extends { progress: CourseProgressSummary }>(courses: T[], limit = 3): T[] {
  const open = courses.filter((c) => c.progress.total > 0 && !c.progress.isComplete);
  const started = open.filter((c) => c.progress.completed > 0);
  const notStarted = open.filter((c) => c.progress.completed === 0);
  return [...started, ...notStarted].slice(0, limit);
}
