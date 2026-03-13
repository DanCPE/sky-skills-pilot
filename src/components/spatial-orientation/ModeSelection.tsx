"use client";

import { useState } from "react";
import type { SpatialOrientationQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: SpatialOrientationQuizResponse) => void;
}

type Mode = "learning" | "practice" | null;

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  const [selectedMode, setSelectedMode] = useState<Mode>(null);
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
         selectedMode === "learning" ? 10 : questionCount, 
         selectedMode
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
        {/* Learning Mode */}
        <button
          onClick={() => setSelectedMode("learning")}
          disabled={isLoading}
          className={`rounded-2xl border-2 p-6 text-left transition-all ${
            selectedMode === "learning"
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
                 Learning Mode
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

        {/* Practice Mode */}
        <button
          onClick={() => setSelectedMode("practice")}
          disabled={isLoading}
          className={`rounded-2xl border-2 p-6 text-left transition-all ${
            selectedMode === "practice"
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
                 Practice Mode
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

       {/* Slider for Practice Mode Only */}
       {selectedMode === "practice" && (
        <div className="mb-8 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <label className="mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Number of Questions: <span className="font-bold text-violet-600 dark:text-violet-400">{questionCount}</span>
          </label>
          <input
            type="range"
            min="10"
            max="50"
            step="10"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="w-full cursor-pointer accent-violet-600"
          />
          <div className="mt-2 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>10</span>
            <span>20</span>
            <span>30</span>
            <span>40</span>
            <span>50</span>
          </div>
        </div>
      )}

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
