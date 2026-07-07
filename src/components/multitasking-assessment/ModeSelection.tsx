"use client";

import { useState } from "react";
import SharedModeSelection from "@/components/shared/ModeSelection";
import type {
  MultitaskingAssessmentConfig,
  MultitaskingAssessmentDifficulty,
  MultitaskingAssessmentMode,
} from "@/types";

interface ModeSelectionProps {
  onStart: (config: MultitaskingAssessmentConfig) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  const [assessmentMode, setAssessmentMode] =
    useState<MultitaskingAssessmentMode>("full");

  return (
    <SharedModeSelection<
      MultitaskingAssessmentConfig,
      MultitaskingAssessmentDifficulty
    >
      subtitle="A timed MATB-style run with gauge monitoring, coordinate selection, signal detection, voice response, and optional math questions."
      topicSlug="multitasking-assessment"
      defaultQuestionCount={4}
      sliderLabel="Session Length"
      sliderMin={1}
      sliderMax={6}
      sliderStep={1}
      sliderLabels={[1, 2, 3, 4, 5, 6]}
      formatSliderLabel={(value) => `${value} min`}
      sliderHelperText={(value) =>
        `${value} minute${value === 1 ? "" : "s"} of continuous tasking`
      }
      timePerQuestion={60}
      showDifficulty={false}
      learnDescription="Run a shorter practice session with the same task panels and score breakdown."
      realDescription={(_count, time) =>
        `A recorded assessment run. ${time}. Only this quest now contributes to the multitasking dashboard score.`
      }
      startLabel="Start Assessment"
      loadingLabel="Preparing..."
      childrenBeforeDifficulty={({ isLoading }) => (
        <>
          <div className="mb-8 rounded-2xl border-2 border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black/40">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              How this quest works
            </h3>
            <div className="mt-4 grid gap-3 text-xs leading-5 text-zinc-600 dark:text-zinc-300 md:grid-cols-2">
              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-white/5">
                <span className="font-bold text-zinc-900 dark:text-white">
                  1. Correct the gauge.
                </span>{" "}
                Watch the marker on the horizontal gauge. It may slow, pause,
                reverse, or jitter. When the marker turns red above the green
                band, click ▲. When it turns red below the green band, click ▼.
              </div>
              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-white/5">
                <span className="font-bold text-zinc-900 dark:text-white">
                  2. Use the coordinate grid.
                </span>{" "}
                Rows are A-J and columns are 1-10. Cells are blank on purpose.
                If a green signal says A-4, click row A, column 4. Clicked cells
                stay green.
              </div>
              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-white/5">
                <span className="font-bold text-zinc-900 dark:text-white">
                  3. Read the signal dots.
                </span>{" "}
                Three dots sit beside the grid. Click only when a dot is green.
                Red dots can still show fake coordinates; do nothing for those.
              </div>
              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-white/5">
                <span className="font-bold text-zinc-900 dark:text-white">
                  4. Answer voice prompts.
                </span>{" "}
                The quiz speaks random arithmetic aloud, gives you a short
                thinking gap, then listens. Say the numeric answer clearly.
              </div>
              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-white/5">
                <span className="font-bold text-zinc-900 dark:text-white">
                  5. Fill math boxes.
                </span>{" "}
                In Full 5, all mixed questions are visible at once: 3-digit
                add/subtract plus 2-digit multiply and clean division. Fill
                boxes before the session ends; there is no Submit button.
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border-2 border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black/40">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
              Task Set
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["core", "full"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setAssessmentMode(mode)}
                  className={`rounded-xl border px-3 py-3 text-sm font-bold capitalize transition ${
                    assessmentMode === mode
                      ? "border-brand-purple bg-violet-50 text-brand-purple dark:border-brand-gold dark:bg-brand-gold/10 dark:text-brand-gold"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/10"
                  }`}
                >
                  {mode === "core" ? "Core 3" : "Full 5"}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Core uses monitoring, grid selection, signal detection, and voice
              response. Full adds untimed math questions.
            </p>
          </div>
        </>
      )}
      onFetch={async (mode, _difficulty, sessionLengthMinutes) => ({
        mode,
        difficulty: "medium",
        sessionLengthSeconds: sessionLengthMinutes * 60,
        assessmentMode,
        ownId: "MATB",
      })}
      onStart={onStart}
    />
  );
}
