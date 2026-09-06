"use client";

import type { TournamentRankingEntry } from "@/lib/real-tournament/types";

function formatScore(champion: TournamentRankingEntry) {
  return `${champion.correctCount}/${champion.questionCount}`;
}

function formatTime(seconds: number | null) {
  if (seconds === null) return "-";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

export default function PreviousChampionFlag({
  champion,
  weekId,
}: {
  champion: TournamentRankingEntry | null;
  weekId: string | null;
}) {
  if (!champion) return null;

  return (
    <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-amber-300 bg-white shadow-lg shadow-amber-900/10 dark:border-brand-gold/35 dark:bg-zinc-950 dark:shadow-black/40">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-2 bg-[repeating-linear-gradient(90deg,#f59e0b_0,#f59e0b_26px,#ffffff_26px,#ffffff_38px)] dark:bg-[repeating-linear-gradient(90deg,#f6c453_0,#f6c453_26px,#18181b_26px,#18181b_38px)]" />
        <div className="absolute -right-14 top-9 h-24 w-56 rotate-[-12deg] rounded-full border-y-4 border-amber-200 opacity-60 dark:border-brand-gold/20" />
        <div className="absolute -right-8 top-16 h-12 w-44 rotate-[-12deg] rounded-full border-y-2 border-[#4F12A6]/25 opacity-60 dark:border-brand-gold/25" />

        <div className="relative flex flex-col gap-5 px-5 pb-5 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700 dark:text-brand-gold">
              Ace-Pilot of the Week{weekId ? ` · ${weekId}` : ""}
            </p>
            <div className="mt-1 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-stretch">
              <div className="relative inline-flex w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-amber-300/35 bg-amber-50/70 px-4 py-3 text-center leading-none shadow-[0_10px_22px_rgba(120,53,15,0.14),inset_0_1px_0_rgba(255,255,255,0.62),inset_0_-10px_20px_rgba(245,158,11,0.08)] ring-1 ring-white/45 backdrop-blur-sm dark:border-white/10 dark:bg-black dark:shadow-[0_12px_26px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-14px_24px_rgba(255,255,255,0.06)] dark:ring-white/10">
                {/* <span className="pointer-events-none absolute inset-x-2 top-1 h-1/3 rounded-full bg-white/35 blur-sm dark:bg-white/18" /> */}
                <span className="pointer-events-none absolute -right-6 top-0 h-full w-10 rotate-12 bg-white/20 blur-md dark:bg-white/14" />
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-700 dark:text-brand-gold">
                    Rank
                  </div>
                  <div className="mt-1 text-3xl font-black text-[#4F12A6] dark:text-brand-gold">
                    #1
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-zinc-950 dark:text-zinc-50 sm:text-3xl">
                  Congratulations, {champion.profileName}
                </h2>
                <div className="mt-3 flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-700 text-sm font-bold text-white ring-2 ring-amber-300 ring-offset-2 ring-offset-white dark:ring-brand-gold dark:ring-offset-zinc-950">
                    {champion.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={champion.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitial(champion.profileName)
                    )}
                  </span>
                  <p className="min-w-0 text-sm font-semibold leading-6 text-zinc-600 dark:text-zinc-300">
                    Previous tournament top pilot. Cleared for the champion board.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-amber-200 pt-4 dark:border-brand-gold/20 sm:w-auto sm:min-w-72 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
              Final Approach
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <span className="min-w-0">
                <span className="block text-xl font-black text-zinc-950 dark:text-zinc-50">
                  {formatScore(champion)}
                </span>
                <span className="mt-1 block text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  Score
                </span>
              </span>
              <span className="min-w-0 border-x border-amber-200 px-2 dark:border-brand-gold/20">
                <span className="block text-xl font-black text-zinc-950 dark:text-zinc-50">
                  {Math.round(champion.percentage)}%
                </span>
                <span className="mt-1 block text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  Accuracy
                </span>
              </span>
              <span className="min-w-0">
                <span className="block text-xl font-black text-zinc-950 dark:text-zinc-50">
                  {formatTime(champion.timeTakenSeconds)}
                </span>
                <span className="mt-1 block text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  Time
                </span>
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full w-full bg-[repeating-linear-gradient(90deg,#4F12A6_0,#4F12A6_18px,#f59e0b_18px,#f59e0b_26px)] dark:bg-[repeating-linear-gradient(90deg,#f6c453_0,#f6c453_18px,#4F12A6_18px,#4F12A6_26px)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
