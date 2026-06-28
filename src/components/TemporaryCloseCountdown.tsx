"use client";

import { useEffect, useMemo, useState } from "react";

const COUNTDOWN_HOURS = 24;
const COUNTDOWN_STORAGE_KEY = "sky-temporary-close-countdown-start";

function getCountdownStart() {
  const now = Date.now();

  try {
    const stored = window.localStorage.getItem(COUNTDOWN_STORAGE_KEY);
    const parsed = stored ? Number(stored) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    window.localStorage.setItem(COUNTDOWN_STORAGE_KEY, String(now));
  } catch {
    // If storage is unavailable, the current visit still gets a 24-hour timer.
  }

  return now;
}

function formatTime(value: number) {
  return String(value).padStart(2, "0");
}

export default function TemporaryCloseCountdown() {
  const countdownEnd = useMemo(
    () => getCountdownStart() + COUNTDOWN_HOURS * 60 * 60 * 1000,
    [],
  );
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, countdownEnd - Date.now()),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemainingMs(Math.max(0, countdownEnd - Date.now()));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [countdownEnd]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="mt-8 flex justify-center gap-3 text-center">
      {[
        ["Hours", hours],
        ["Minutes", minutes],
        ["Seconds", seconds],
      ].map(([label, value]) => (
        <div
          key={String(label)}
          className="min-w-24 rounded-2xl border border-white/10 bg-white/10 px-4 py-4 shadow-xl backdrop-blur"
        >
          <div className="text-3xl font-bold tabular-nums text-white sm:text-4xl">
            {formatTime(Number(value))}
          </div>
          <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
