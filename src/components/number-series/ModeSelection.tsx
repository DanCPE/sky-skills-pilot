"use client";

import { useState } from "react";
import type { NumberSeriesQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: NumberSeriesQuizResponse) => void;
}

type Mode = "learning" | "practice" | null;
type Difficulty = "easy" | "medium" | "hard" | "mixed";

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  const [selectedMode, setSelectedMode] = useState<Mode>(null);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>("mixed");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!selectedMode) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        mode: selectedMode,
        difficulty: selectedDifficulty,
        count: "10",
      });

      const response = await fetch(`/api/number-series/questions?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load questions");
      }

      const quizData: NumberSeriesQuizResponse = await response.json();
      onStart(quizData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-zinc-100">
          Choose Your Mode
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Select a mode and difficulty to start practicing number series
        </p>
      </div>

      {/* Mode Selection */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Learning Mode Card */}
        <button
          onClick={() => setSelectedMode("learning")}
          disabled={isLoading}
          className={`rounded-2xl border-2 p-6 text-left transition-all ${
            selectedMode === "learning"
              ? "border-violet-600 bg-violet-50 dark:border-violet-500 dark:bg-violet-950"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900">
              <svg
                className="h-6 w-6 text-violet-600 dark:text-violet-400"
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
                Learning Mode
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No time limit
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Learn at your own pace with immediate feedback and detailed
            explanations after each question.
          </p>
        </button>

        {/* Practice Mode Card */}
        <button
          onClick={() => setSelectedMode("practice")}
          disabled={isLoading}
          className={`rounded-2xl border-2 p-6 text-left transition-all ${
            selectedMode === "practice"
              ? "border-violet-600 bg-violet-50 dark:border-violet-500 dark:bg-violet-950"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900">
              <svg
                className="h-6 w-6 text-violet-600 dark:text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Practice Mode
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                5 minutes for 10 questions
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Test your skills under time pressure. See your score at the end and
            track your improvement.
          </p>
        </button>
      </div>

      {/* Difficulty Selection */}
      <div className="mb-8">
        <label className="mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Difficulty Level
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["easy", "medium", "hard", "mixed"] as Difficulty[]).map(
            (difficulty) => (
              <button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty)}
                disabled={isLoading}
                className={`rounded-lg border-2 px-4 py-3 text-sm font-medium capitalize transition-all ${
                  selectedDifficulty === difficulty
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700"
                } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                {difficulty}
              </button>
            )
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Start Button */}
      <div className="text-center">
        <button
          onClick={handleStart}
          disabled={!selectedMode || isLoading}
          className={`inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-bold text-white transition-all ${
            !selectedMode || isLoading
              ? "cursor-not-allowed bg-zinc-400"
              : "cursor-pointer bg-violet-600 hover:bg-violet-500 active:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500"
          }`}
        >
          {isLoading ? (
            <>
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading...
            </>
          ) : (
            <>
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Start Quiz
            </>
          )}
        </button>
      </div>
    </div>
  );
}
