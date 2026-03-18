"use client";

import Image from "next/image";
import { useState } from "react";
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

      {/* Question Count Slider */}
      <div className="mb-8 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/40 dark:backdrop-blur-md p-6">
        <label className="mb-6 block text-[16px] font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-inter)] text-left">
          Number of Questions
        </label>
        <div className="relative h-10 flex items-center px-2">
          {/* Custom Track Background */}
          <div className="absolute left-2 right-2 h-1.5 rounded-lg bg-[#F2F1F9] dark:bg-[#FFFFFF]" />
          
          {/* Custom Progress Line */}
          <div 
            className="absolute left-2 h-1.5 rounded-l-lg bg-[#4F12A6] dark:bg-brand-gold transition-all duration-200"
            style={{ width: `calc(${(questionCount - 10) / 90 * 100}% - 8px)` }}
          />

          <input
            type="range"
            min="10"
            max="100"
            step="10"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            disabled={isLoading}
            className="relative w-full h-1.5 appearance-none bg-transparent cursor-pointer z-10
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#4F12A6] dark:[&::-webkit-slider-thumb]:bg-brand-gold
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-zinc-900
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
              [&::-moz-range-thumb]:bg-[#4F12A6] dark:[&::-moz-range-thumb]:bg-brand-gold
              [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-zinc-900"
          />
        </div>
        <div className="mt-2 flex justify-between text-[16px] font-bold text-zinc-500 dark:text-zinc-400 font-[family-name:var(--font-inter)] px-1">
          <span className={questionCount === 10 ? "text-[#4F12A6] dark:text-brand-gold" : ""}>10</span>
          <span className={questionCount === 25 ? "text-[#4F12A6] dark:text-brand-gold" : ""}>25</span>
          <span className={questionCount === 50 ? "text-[#4F12A6] dark:text-brand-gold" : ""}>50</span>
          <span className={questionCount === 75 ? "text-[#4F12A6] dark:text-brand-gold" : ""}>75</span>
          <span className={questionCount === 100 ? "text-[#4F12A6] dark:text-brand-gold" : ""}>100</span>
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
