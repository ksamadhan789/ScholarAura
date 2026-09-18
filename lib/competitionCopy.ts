export type ThemeTopicSplit = {
  lead: string;
  theme: string;
  topic: string;
};

// Competition "theme" and "poster topic" aren't separate database fields —
// they're written into the free-text description, e.g.
// `... Theme: "Youth as Health Ambassadors" Poster Topic:"Role of Young Pharmacists ..."`.
// When an admin's description follows that convention, split it out for a
// nicer two-card presentation; otherwise return null so the caller falls
// back to showing the plain description untouched — never invents a
// theme/topic that isn't actually there.
export function parseThemeTopic(description: string): ThemeTopicSplit | null {
  const themeMatch = description.match(/Theme:\s*["“]([^"”]+)["”]/i);
  const topicMatch = description.match(/(?:Poster\s+)?Topic:\s*["“]([^"”]+)["”]/i);
  if (!themeMatch || !topicMatch) return null;

  const lead = description.slice(0, description.indexOf(themeMatch[0])).trim();

  return {
    lead,
    theme: themeMatch[1].trim(),
    topic: topicMatch[1].trim(),
  };
}
