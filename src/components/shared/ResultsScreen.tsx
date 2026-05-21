"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getPerformanceMessage,
  getPerformanceStarCount,
} from "@/lib/performance-copy";

interface ResultsScreenProps {
  totalCount: number;
  /** All recorded answers. Used to derive attempted/correct/accuracy. */
  answers: { isCorrect: boolean; answer?: string }[];
  timeTaken?: number;
  onRestart: () => void;
  restartLabel?: string;
  showBackButton?: boolean;
  /** Topic-specific question review section */
  children?: React.ReactNode;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ResultsScreen({
  totalCount,
  answers,
  timeTaken,
  onRestart,
  restartLabel = "Try Again",
  showBackButton = true,
  children,
}: ResultsScreenProps) {
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const attemptedCount = answers.filter(
    (a) => a.answer !== undefined && a.answer !== ""
  ).length;
  const percentage = Math.round((correctCount / totalCount) * 100);
  const accuracy =
    attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  const [performanceText] = useState(() => getPerformanceMessage(percentage));
  const performance = {
    text: performanceText,
    starCount: getPerformanceStarCount(percentage),
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Score Card */}
      <div className="mb-8 rounded-2xl border-2 bg-zinc-50 p-8 text-center dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md">
        {/* Stars */}
        <div className="mb-4 flex justify-center gap-1">
          {Array.from({ length: performance.starCount }).map((_, i) => (
            <svg
              key={i}
              className="h-14 w-14"
              fill="none"
              stroke="#FACC15"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z"
              />
            </svg>
          ))}
        </div>

        <h2 className="mb-2 text-3xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-brand-gold">
          {performance.text}
        </h2>
        <p className="mb-6 text-base text-zinc-500 dark:text-zinc-400">
          You got {correctCount} out of {totalCount} correct
        </p>

        {/* Stats Row */}
        <div className="mb-4 flex justify-center gap-8">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-[#4F12A6] dark:text-brand-gold font-[family-name:var(--font-space-grotesk)]">
              {attemptedCount}
            </span>
            <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Attempted
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-[#4F12A6] dark:text-brand-gold font-[family-name:var(--font-space-grotesk)]">
              {correctCount}
            </span>
            <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Correct
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-[#4F12A6] dark:text-brand-gold font-[family-name:var(--font-space-grotesk)]">
              {accuracy}%
            </span>
            <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Accuracy
            </span>
          </div>
        </div>

        {timeTaken !== undefined && (
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Duration : {formatTime(timeTaken)}
          </p>
        )}
      </div>

      {/* Topic-specific review section */}
      {children && <div className="mb-8">{children}</div>}

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <button
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F12A6] px-10 py-4 text-lg font-bold text-white shadow-lg shadow-[#4F12A6]/20 transition-all hover:opacity-90 active:scale-95"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {restartLabel}
        </button>
        {showBackButton && (
          <Link
            href="/sky-quest"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-zinc-300 px-8 py-4 font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Sky Quests
          </Link>
        )}
      </div>
    </div>
  );
}
