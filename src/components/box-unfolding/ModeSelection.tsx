"use client";

import { useState } from "react";
import SharedModeSelection from "@/components/shared/ModeSelection";
import { generateBoxUnfoldingQuiz } from "@/lib/box-folding-generator";
import type {
  BoxFoldingQuizResponse,
  BoxUnfoldingChoiceCount,
  BoxUnfoldingMode,
} from "@/types";

const unfoldingModes: {
  value: BoxUnfoldingMode;
  label: string;
  description: string;
}[] = [
  {
    value: "3-side",
    label: "3 Side",
    description: "Match only the fixed three visible faces.",
  },
  {
    value: "6-side",
    label: "6 Side",
    description: "Rotate and match the full cube.",
  },
];

const choiceLayouts: {
  value: BoxUnfoldingChoiceCount;
  label: string;
  description: string;
}[] = [
  {
    value: 9,
    label: "9 Choices",
    description: "Current full set with a compact 3 x 3 grid.",
  },
  {
    value: 6,
    label: "6 Choices",
    description: "Larger nets with a wider 3 x 2 answer grid.",
  },
];

function formatRealModeTime(questionCount: number, unfoldingMode: BoxUnfoldingMode) {
  const seconds = questionCount * (unfoldingMode === "3-side" ? 15 : 54);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (remaining === 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""} ${remaining} seconds`;
}

export default function ModeSelection({
  onStart,
}: {
  onStart: (quizData: BoxFoldingQuizResponse) => void;
}) {
  const [unfoldingMode, setUnfoldingMode] =
    useState<BoxUnfoldingMode>("3-side");
  const [choiceCount, setChoiceCount] =
    useState<BoxUnfoldingChoiceCount>(9);

  return (
    <SharedModeSelection<BoxFoldingQuizResponse>
      subtitle="Study the folded cube, then choose the only flat net that can unfold from it."
      defaultQuestionCount={10}
      sliderMin={5}
      sliderMax={25}
      sliderStep={5}
      sliderLabels={[5, 10, 15, 20, 25]}
      timePerQuestion={unfoldingMode === "3-side" ? 15 : 54}
      childrenBeforeDifficulty={
        <div className="mb-8 space-y-6">
          <div>
            <label className="mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Unfolding Mode
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {unfoldingModes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setUnfoldingMode(mode.value)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    unfoldingMode === mode.value
                      ? "border-brand-purple bg-brand-purple text-white shadow-md shadow-brand-purple/20"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-white/20"
                  }`}
                >
                  <span className="block text-sm font-bold">{mode.label}</span>
                  <span
                    className={`mt-1 block text-xs ${
                      unfoldingMode === mode.value
                        ? "text-white/80"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {mode.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Answer Layout
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {choiceLayouts.map((layout) => (
                <button
                  key={layout.value}
                  type="button"
                  onClick={() => setChoiceCount(layout.value)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    choiceCount === layout.value
                      ? "border-brand-purple bg-brand-purple text-white shadow-md shadow-brand-purple/20"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-white/20"
                  }`}
                >
                  <span className="block text-sm font-bold">{layout.label}</span>
                  <span
                    className={`mt-1 block text-xs ${
                      choiceCount === layout.value
                        ? "text-white/80"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {layout.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      }
      formatRealModeTime={(count) => formatRealModeTime(count, unfoldingMode)}
      learnDescription="Work without a timer. Rotate the cube, compare every net, and review the valid unfolding afterward."
      realDescription={(count, timeDisplay) =>
        `Solve ${count} box-unfolding puzzles under time pressure. ${timeDisplay}. Harder questions use more directional markings.`
      }
      onFetch={async (mode, difficulty, count) =>
        generateBoxUnfoldingQuiz(count, mode, difficulty, unfoldingMode, choiceCount)
      }
      onStart={onStart}
    />
  );
}
