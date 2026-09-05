"use client";

import { useEffect } from "react";

/** Fires once when the lecture page mounts, so progress tracking has a real start time. */
export function LectureStartPing({ slug, videoId }: { slug: string; videoId: string }) {
  useEffect(() => {
    fetch(`/api/courses/${slug}/videos/${videoId}/start`, { method: "POST" }).catch(() => {});
  }, [slug, videoId]);

  return null;
}
