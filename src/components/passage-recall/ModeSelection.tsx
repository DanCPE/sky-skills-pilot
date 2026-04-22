"use client";

import { useState } from "react";
import type { ShortTermMemoryQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: ShortTermMemoryQuizResponse) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/passage-recall/questions");

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to load passage recall quiz");
      }

      onStart((await response.json()) as ShortTermMemoryQuizResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-white">
          Start Passage Recall
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Read one aviation passage for 2 minutes, then recall the details after it
          disappears.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border-2 border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">1. Read</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Memorize the generated aviation passage during a fixed 120-second timer.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">2. Wipe</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              When time is up, the passage is removed from state and no longer rendered.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">3. Recall</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Answer multiple-choice questions built from the exact passage you read.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      ) : null}

      <div className="text-center">
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-xl bg-[#4F12A6] px-10 py-4 text-lg font-bold text-white shadow-lg shadow-[#4F12A6]/20 transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Generating Passage..." : "Start Quest"}
        </button>
      </div>
    </div>
  );
}
