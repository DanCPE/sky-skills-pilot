"use client";

import { useState } from "react";
import SharedModeSelection from "@/components/shared/ModeSelection";
import type { JoyStickGameQuizResponse } from "@/types";

type Difficulty = "easy" | "medium" | "hard" | "mixed";

interface ModeSelectionProps {
  onStart: (quizData: JoyStickGameQuizResponse) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  const [bpm, setBpm] = useState(90);

  return (
    <SharedModeSelection<JoyStickGameQuizResponse, Difficulty>
      subtitle="Fly the hexagon with a joystick or WASD while answering mental math."
      topicSlug="joy-stick-game"
      availableModes={["learn"]}
      defaultQuestionCount={20}
      learnDescription="Set difficulty, question rhythm, obstacle speed, obstacle count, and aircraft sensitivity."
      childrenBeforeDifficulty={({ isLoading }) => (
        <div className="mb-8 rounded-2xl border-2 border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black/40">
          <div className="mb-3 flex items-center justify-between">
            <label
              htmlFor="joy-stick-bpm"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Question BPM
            </label>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">
              {bpm}
            </span>
          </div>
          <input
            id="joy-stick-bpm"
            type="range"
            min={50}
            max={180}
            step={5}
            value={bpm}
            disabled={isLoading}
            onChange={(event) => setBpm(Number(event.target.value))}
            className="w-full accent-brand-purple disabled:opacity-50"
          />
          <div className="mt-2 flex justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>50</span>
            <span>180</span>
          </div>
        </div>
      )}
      onFetch={async (mode, difficulty, count) => {
        const params = new URLSearchParams({
          mode,
          difficulty,
          count: String(count),
          bpm: String(bpm),
        });

        const response = await fetch(`/api/joy-stick-game/questions?${params}`);
        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || "Failed to load questions");
        }

        return (await response.json()) as JoyStickGameQuizResponse;
      }}
      onStart={onStart}
    />
  );
}
