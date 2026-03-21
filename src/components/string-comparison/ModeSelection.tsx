"use client";

import { useState } from "react";
import QuestionCountSlider from "../shared/QuestionCountSlider";
import type { ScanningPracticeQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: ScanningPracticeQuizResponse) => void;
}

type Mode = "learn" | "real" | null;
type Difficulty = "easy" | "medium" | "hard" | "mixed";

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  const [selectedMode, setSelectedMode] = useState<Mode>(null);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>("mixed");
  const [questionCount, setQuestionCount] = useState(40);
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
        count: String(questionCount),
      });

      const response = await fetch(`/api/string-comparison/questions?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load questions");
      }

      const quizData: ScanningPracticeQuizResponse = await response.json();
      onStart(quizData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `${remainingSeconds} seconds`;
    }
    return `${minutes} minute${minutes > 1 ? "s" : ""} ${remainingSeconds > 0 ? `${remainingSeconds} seconds` : ""}`;
  };

  const timeLimit = questionCount * 3; // 3 seconds per question

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-brand-gold">
          Choose Your Mode
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Practice quick visual comparison for pilot aptitude tests
        </p>
      </div>

      {/* Mode Selection */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Learn Mode Card */}
        <button
          onClick={() => setSelectedMode("learn")}
          disabled={isLoading}
          className={`rounded-2xl border-2 p-6 text-left transition-all ${
            selectedMode === "learn"
              ? "border-brand-purple bg-violet-50 dark:border-brand-purple dark:bg-brand-purple/20"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md dark:hover:border-white/20"
          } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-brand-purple">
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
                Learn Mode
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

        {/* Real Mode Card */}
        <button
          onClick={() => setSelectedMode("real")}
          disabled={isLoading}
          className={`rounded-2xl border-2 p-6 text-left transition-all ${
            selectedMode === "real"
              ? "border-brand-purple bg-violet-50 dark:border-brand-purple dark:bg-brand-purple/20"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md dark:hover:border-white/20"
          } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-brand-purple">
              <svg
                className="h-6 w-6 text-violet-600 dark:text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
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
                {formatTime(timeLimit)} for {questionCount} questions
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Test your skills under time pressure. See your score and timing at
            the end to track your improvement.
          </p>
        </button>
      </div>
      
      {/* Difficulty Selection */}
      <div className="mb-8">
        <label className="mb-3 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
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
                    ? "border-brand-purple bg-brand-purple text-white shadow-md shadow-brand-purple/20"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-white/20"
                } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                {difficulty}
              </button>
            )
          )}
        </div>
      </div>

      <QuestionCountSlider
              value={questionCount}
              min={10}
              max={50}
              step={10}
              onChange={setQuestionCount}
              labels={[10, 20, 30, 40, 50]}
              isLoading={isLoading}
            />

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
          className={`inline-flex items-center gap-2 rounded-xl px-12 py-4 text-lg font-bold text-white transition-all active:scale-95 shadow-lg ${
            !selectedMode || isLoading
              ? "cursor-not-allowed bg-zinc-400"
              : "cursor-pointer bg-brand-purple hover:bg-violet-500 shadow-brand-purple/20 dark:hover:shadow-brand-purple/40"
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
              Start Quest
            </>
          )}
        </button>
      </div>
    </div>
  );
}
