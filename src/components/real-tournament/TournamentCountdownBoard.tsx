"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getRealTournamentWeekTiming } from "@/lib/real-tournament/config";

function getRemainingParts(targetMs: number, now: number) {
  const totalSeconds = Math.max(0, Math.floor((targetMs - now) / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalSeconds };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export default function TournamentCountdownBoard() {
  const [now, setNow] = useState(() => Date.now());
  const weekTiming = useMemo(() => getRealTournamentWeekTiming(now), [now]);
  const [isDismissed, setIsDismissed] = useState(false);
  const remaining = getRemainingParts(weekTiming.weekEndMs, now);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsDismissed(
        window.localStorage.getItem(
          `real-tournament-countdown-dismissed:${weekTiming.weekId}`,
        ) === "true",
      );
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [weekTiming.weekId]);

  if (isDismissed) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-4 z-30 hidden w-[min(360px,calc(100vw-2rem))] animate-[tournament-board-drift_9s_ease-in-out_infinite] md:block">
      <button
        type="button"
        aria-label="Close tournament countdown"
        onClick={() => {
          window.localStorage.setItem(
            `real-tournament-countdown-dismissed:${weekTiming.weekId}`,
            "true",
          );
          setIsDismissed(true);
        }}
        className="pointer-events-auto absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-black text-zinc-500 shadow-md transition hover:text-zinc-900 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-white"
      >
        x
      </button>
      <Link
        href="/sky-quest/real-tournament"
        className="pointer-events-auto block rotate-[-2deg] rounded-lg border-2 border-[#4F12A6] bg-white/95 p-4 text-left shadow-2xl shadow-violet-900/20 transition hover:rotate-0 hover:scale-[1.02] dark:border-brand-gold dark:bg-zinc-950/95"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4F12A6] dark:text-brand-gold">
              Real Tournament
            </p>
            <h2 className="mt-1 text-lg font-black text-zinc-900 dark:text-zinc-100">
              Weekly reset incoming
            </h2>
          </div>
          <span className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-black uppercase text-white">
            Live
          </span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Days", value: remaining.days },
            { label: "Hours", value: remaining.hours },
            { label: "Min", value: remaining.minutes },
            { label: "Sec", value: remaining.seconds },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-2 dark:border-white/10 dark:bg-white/5"
            >
              <div className="text-xl font-black tabular-nums text-zinc-900 dark:text-zinc-100">
                {item.label === "Days" ? item.value : pad(item.value)}
              </div>
              <div className="mt-1 text-[9px] font-bold uppercase text-zinc-400">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-zinc-500 dark:text-zinc-400">
            Board refuses to stay on the page.
          </span>
          <span className="font-black text-[#4F12A6] dark:text-brand-gold">
            Enter
          </span>
        </div>
      </Link>
    </div>
  );
}
