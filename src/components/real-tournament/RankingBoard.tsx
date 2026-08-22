"use client";

import Image from "next/image";
import type { TournamentRankingEntry } from "@/lib/real-tournament/types";

export default function RankingBoard({
  ranking,
  loading,
}: {
  ranking: TournamentRankingEntry[];
  loading: boolean;
}) {
  return (
    <section className="mx-auto w-full max-w-4xl">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Tournament Ranking
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            The board is visible before every tournament start.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-black/30">
        <div className="grid grid-cols-[64px_1fr_96px_96px] gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold uppercase text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
          <span>Rank</span>
          <span>Pilot</span>
          <span className="text-right">Score</span>
          <span className="text-right">Time</span>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">
            Loading ranking...
          </div>
        ) : ranking.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">
            No tournament scores yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-white/10">
            {ranking.map((entry) => (
              <div
                key={`${entry.rank}-${entry.profileName}-${entry.completedAt}`}
                className="grid grid-cols-[64px_1fr_96px_96px] items-center gap-3 px-4 py-3 text-sm"
              >
                <span className="font-bold text-[#4F12A6] dark:text-brand-gold">
                  #{entry.rank}
                </span>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="relative h-8 w-8 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                    {entry.imageUrl ? (
                      <Image
                        src={entry.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                    {entry.profileName}
                  </span>
                </div>
                <span className="text-right font-bold text-zinc-900 dark:text-zinc-100">
                  {entry.correctCount}/{entry.questionCount}
                </span>
                <span className="text-right text-zinc-500 dark:text-zinc-400">
                  {entry.timeTakenSeconds === null
                    ? "-"
                    : `${entry.timeTakenSeconds}s`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
