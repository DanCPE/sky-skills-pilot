"use client";

import { useState } from "react";
import QuestionCountSlider from "../shared/QuestionCountSlider";
import type { SpatialOrientationQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: SpatialOrientationQuizResponse) => void;
}

type Mode = "learn" | "real" | null;
type Difficulty = "easy" | "medium" | "hard" | "mixed";

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  const [selectedMode, setSelectedMode] = useState<Mode>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("mixed");
  const [questionCount, setQuestionCount] = useState(20);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (!selectedMode) return;
    setIsLoading(true);

    try {
      // For this implementation, we can just generate client-side to save API wiring, 
      // or we can mock the API response. We'll use the imported generator directly for speed.
      const { generateSpatialOrientationQuiz } = await import("@/lib/spatial-orientation-generator");
      const quizData = generateSpatialOrientationQuiz(
         questionCount,
         selectedMode,
         selectedDifficulty
      );
      
      onStart(quizData);
    } catch (err) {
      console.error(err);
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

  const timeLimit = questionCount * 15; // 15 seconds per question for math

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-zinc-100">
          Choose Your Mode
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Calculate aircraft heading changes and rotations
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Learn Mode */}
        <button
          onClick={() => setSelectedMode("learn")}
          disabled={isLoading}
          className={`rounded-2xl border-2 p-6 text-left transition-all ${
            selectedMode === "learn"
              ? "border-violet-600 bg-violet-50 dark:border-violet-500 dark:bg-violet-950"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          }`}
        >
          <div className="mb-3 flex items-center gap-3">
             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900">
               <span className="text-2xl">✈️</span>
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
            Learn at your own pace with interactive 3D visualizers and animated feedback loops.
          </p>
        </button>

        {/* Real Mode */}
        <button
          onClick={() => setSelectedMode("real")}
          disabled={isLoading}
          className={`rounded-2xl border-2 p-6 text-left transition-all ${
            selectedMode === "real"
              ? "border-violet-600 bg-violet-50 dark:border-violet-500 dark:bg-violet-950"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          }`}
        >
           <div className="mb-3 flex items-center gap-3">
             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900">
                <span className="text-2xl">⏱️</span>
             </div>
             <div>
               <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                 Real Mode
               </h3>
               <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatTime(timeLimit)}
               </p>
             </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Test your math speed under time pressure. Answer {questionCount} rapid-fire format questions.
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

      <div className="text-center">
        <button
          onClick={handleStart}
          disabled={!selectedMode || isLoading}
          className={`inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-bold text-white transition-all ${
            !selectedMode || isLoading
              ? "cursor-not-allowed bg-zinc-400"
              : "cursor-pointer bg-violet-600 hover:bg-violet-500"
          }`}
        >
          {isLoading ? "Loading..." : "Start Sequence"}
        </button>
      </div>
    </div>
  );
}
