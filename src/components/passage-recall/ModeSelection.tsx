"use client";

import { useState } from "react";
import type { PassageRecallQuizResponse } from "@/types";
import QuestionCountSlider from "@/components/shared/QuestionCountSlider";

interface ModeSelectionProps {
  onStart: (quizData: PassageRecallQuizResponse) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  const [mode, setMode] = useState<"learn" | "real">("real");
  const [readingSeconds, setReadingSeconds] = useState(120);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        mode,
        duration: String(mode === "real" ? 120 : readingSeconds),
      });
      const response = await fetch(`/api/passage-recall/questions?${params}`);

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to load passage recall quiz");
      }

      onStart((await response.json()) as PassageRecallQuizResponse);
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
          Choose Your Mode
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Read one aviation passage, complete the math distraction, then recall the details after it disappears.
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <button
          onClick={() => setMode("learn")}
          disabled={isLoading}
          className={`rounded-2xl border-2 p-6 text-left transition-all ${
            mode === "learn"
              ? "border-brand-purple bg-violet-50 dark:border-brand-purple dark:bg-brand-purple/20"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md dark:hover:border-white/20"
          } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-brand-purple">
              <svg
                className="h-6 w-6 text-[#4F12A6] dark:text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Learn Mode
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Adjustable reading timer
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Practice with a customizable reading window before the passage is wiped and recall begins.
          </p>
        </button>

        <button
          onClick={() => setMode("real")}
          disabled={isLoading}
          className={`rounded-2xl border-2 p-6 text-left transition-all ${
            mode === "real"
              ? "border-brand-purple bg-violet-50 dark:border-brand-purple dark:bg-brand-purple/20"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md dark:hover:border-white/20"
          } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-brand-purple">
              <svg
                className="h-6 w-6 text-[#4F12A6] dark:text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 2v2M20 20l-1.5-1.5"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Real Mode
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Locked at 2 minutes
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Match the assessment-style setup with a fixed 120-second reading phase before recall.
          </p>
        </button>
      </div>

      {mode === "learn" ? (
        <QuestionCountSlider
          value={readingSeconds}
          min={60}
          max={300}
          step={30}
          onChange={setReadingSeconds}
          labels={[60, 120, 180, 240, 300]}
          isLoading={isLoading}
          title="Reading Time"
          helperText={`${Math.floor(readingSeconds / 60)} minute${readingSeconds === 60 ? "" : "s"}${readingSeconds % 60 === 0 ? "" : ` ${readingSeconds % 60} seconds`}`}
          formatLabel={(value) => `${value / 60}m`}
        />
      ) : null}

      <div className="mb-8 rounded-2xl border-2 border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">1. Read</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Memorize the generated aviation passage during a {mode === "real" ? "fixed 120-second" : "custom"} timer.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">2. Distract</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              When time is up, the passage is removed from state and replaced by 3 math questions.
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
