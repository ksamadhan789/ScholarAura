"use client";

import { useState } from "react";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

/** A round avatar — the given photo `src` when it loads, otherwise initials on a gradient circle. */
export function Avatar({
  name,
  src,
  size = 40,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        onError={() => setErrored(true)}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 font-semibold text-white"
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.36) }}
    >
      {initialsOf(name)}
    </span>
  );
}
