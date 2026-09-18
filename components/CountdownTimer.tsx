"use client";

import { useEffect, useState } from "react";

function getTimeLeft(deadlineMs: number) {
  const diff = deadlineMs - Date.now();
  if (diff <= 0) return null;
  const totalMinutes = Math.floor(diff / 60_000);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

/** A live countdown to a real deadline — never a fabricated number. Recomputed from the actual Date on every tick, so it can't drift out of sync or show stale info. */
export function CountdownTimer({
  deadline,
  closedLabel = "Closed",
}: {
  deadline: string;
  closedLabel?: string;
}) {
  const deadlineMs = new Date(deadline).getTime();
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(deadlineMs));

  useEffect(() => {
    setTimeLeft(getTimeLeft(deadlineMs));
    const id = setInterval(() => setTimeLeft(getTimeLeft(deadlineMs)), 30_000);
    return () => clearInterval(id);
  }, [deadlineMs]);

  if (!timeLeft) {
    return <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">{closedLabel}</p>;
  }

  const unit = (value: number, label: string) => (
    <span className="flex flex-col items-center">
      <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</span>
      <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
    </span>
  );

  return (
    <div
      className="flex items-start gap-4"
      role="timer"
      aria-label={`${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes remaining`}
      suppressHydrationWarning
    >
      {unit(timeLeft.days, timeLeft.days === 1 ? "day" : "days")}
      {unit(timeLeft.hours, "hrs")}
      {unit(timeLeft.minutes, "mins")}
    </div>
  );
}
