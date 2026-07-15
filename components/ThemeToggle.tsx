"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="rounded border border-slate-300 px-2.5 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
