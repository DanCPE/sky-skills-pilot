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
  const [now, setNow] = useState<number | null>(null);
  const weekTiming = useMemo(
    () => (now === null ? null : getRealTournamentWeekTiming(now)),
    [now],
  );
  const [isHidden, setIsHidden] = useState(false);
  const [isDismissedUntilNextTournament, setIsDismissedUntilNextTournament] =
    useState(false);
  const weekId = weekTiming?.weekId;
  const remaining =
    weekTiming && now !== null
      ? getRemainingParts(weekTiming.weekEndMs, now)
      : null;

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setNow(Date.now()));
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!weekId) return;

    const frameId = window.requestAnimationFrame(() => {
      setIsDismissedUntilNextTournament(
        window.localStorage.getItem(
          `real-tournament-countdown-dismissed:${weekId}`,
        ) === "true",
      );
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [weekId]);

  if (!weekTiming || !remaining || isHidden || isDismissedUntilNextTournament) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-4 z-30 hidden w-[min(360px,calc(100vw-2rem))] animate-[tournament-board-drift_9s_ease-in-out_infinite] md:block">
      <button
        type="button"
        aria-label="Close tournament countdown"
        onClick={() => setIsHidden(true)}
        className="pointer-events-auto absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-black text-zinc-500 shadow-md transition hover:text-zinc-900 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-white"
      >
        x
      </button>
      <div className="pointer-events-auto block rotate-[-2deg] rounded-lg border-2 border-[#4F12A6] bg-white/95 p-4 text-left shadow-2xl shadow-violet-900/20 transition hover:rotate-0 hover:scale-[1.02] dark:border-brand-gold dark:bg-zinc-950/95">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4F12A6] dark:text-brand-gold">
              Real Tournament
            </p>
            <h2 className="mt-1 text-lg font-black text-zinc-900 dark:text-zinc-100">
              Tournament will end in
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
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem(
                `real-tournament-countdown-dismissed:${weekTiming.weekId}`,
                "true",
              );
              setIsDismissedUntilNextTournament(true);
            }}
            className="text-left font-semibold text-zinc-500 underline decoration-zinc-300 underline-offset-2 transition hover:text-zinc-900 dark:text-zinc-400 dark:decoration-zinc-700 dark:hover:text-zinc-100"
          >
            Don&apos;t show again until next tournament
          </button>
          <Link
            href="/sky-quest/real-tournament"
            className="font-black text-[#4F12A6] transition hover:text-violet-700 dark:text-brand-gold"
          >
            Enter
          </Link>
        </div>
      </div>
    </div>
  );
}
