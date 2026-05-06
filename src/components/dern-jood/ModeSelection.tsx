"use client";

import { useState } from "react";
import QuestionCountSlider from "@/components/shared/QuestionCountSlider";
import { trackClientEvent } from "@/lib/client-analytics";
import type { DernJoodQuizResponse } from "@/types";

type Mode = "learn" | "real" | null;
type Difficulty = "easy" | "medium" | "hard" | "mixed";

interface ModeSelectionProps {
  onStart: (quizData: DernJoodQuizResponse) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  const [selectedMode, setSelectedMode] = useState<Mode>(null);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>("easy");
  const [questionCount, setQuestionCount] = useState(20);
  const [bpm, setBpm] = useState(90);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!selectedMode) return;
    setIsLoading(true);
    setError(null);

    try {
      await trackClientEvent({
        eventType: "quiz_start",
        pathname:
          typeof window !== "undefined" ? window.location.pathname : "/unknown",
        mode: selectedMode,
        difficulty: selectedMode === "real" ? "mixed" : selectedDifficulty,
        questionCount,
      });

      const params = new URLSearchParams({
        mode: selectedMode,
        difficulty: selectedMode === "real" ? "mixed" : selectedDifficulty,
        count: String(questionCount),
      });

      if (selectedMode === "learn") {
        params.set("bpm", String(bpm));
      }

      const response = await fetch(`/api/dern-jood/questions?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load questions");
      }

      onStart((await response.json()) as DernJoodQuizResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h2 className="mb-3 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-zinc-900 dark:text-white">
          Choose Your Mode
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Practice mental math while holding a steady metronome rhythm.
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-2xl dark:bg-brand-purple">
              ♫
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-inter)] text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Learn Mode
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {bpm} BPM
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Set the math difficulty and BPM yourself. Each question gives more
            or less time based on its complexity.
          </p>
        </button>

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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-2xl dark:bg-brand-purple">
              ⏱
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-inter)] text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Real Mode
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Random 50-180 BPM
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            BPM changes from question to question and math difficulty is mixed.
            Answer before each adaptive timer runs out.
          </p>
        </button>
      </div>

      {selectedMode !== "real" && (
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
                      ? "border-brand-purple bg-brand-purple text-white shadow-md shadow-brand-purple/20"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-white/20"
                  } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  {difficulty}
                </button>
              ),
            )}
          </div>
        </div>
      )}

      {selectedMode !== "real" && (
        <div className="mb-8 rounded-2xl border-2 border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black/40">
          <div className="mb-3 flex items-center justify-between">
            <label
              htmlFor="dern-jood-bpm"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Metronome BPM
            </label>
            <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-zinc-900 dark:text-white">
              {bpm}
            </span>
          </div>
          <input
            id="dern-jood-bpm"
            type="range"
            min={50}
            max={180}
            step={5}
            value={bpm}
            disabled={isLoading}
            onChange={(event) => setBpm(Number(event.target.value))}
            className="w-full accent-brand-purple"
          />
          <div className="mt-2 flex justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>50</span>
            <span>180</span>
          </div>
        </div>
      )}

      <QuestionCountSlider
        value={questionCount}
        min={10}
        max={50}
        step={10}
        onChange={setQuestionCount}
        labels={[10, 20, 30, 40, 50]}
        isLoading={isLoading}
        title="Number of Questions"
      />

      {error && (
        <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={handleStart}
          disabled={!selectedMode || isLoading}
          className={`inline-flex items-center gap-2 rounded-xl px-12 py-4 text-lg font-bold text-white shadow-lg transition-all active:scale-95 ${
            !selectedMode || isLoading
              ? "cursor-not-allowed bg-zinc-400"
              : "cursor-pointer bg-brand-purple shadow-brand-purple/20 hover:opacity-90 dark:hover:shadow-brand-purple/40"
          }`}
        >
          {isLoading ? "Loading..." : "Start Quest"}
        </button>
      </div>
    </div>
  );
}
