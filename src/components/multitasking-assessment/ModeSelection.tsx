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
  const taskSetOptions: Array<{
    mode: MultitaskingAssessmentMode;
    label: string;
    description: string;
  }> = [
    {
      mode: "core2",
      label: "2 Tasks",
      description: "System monitoring and coordinate grid memory.",
    },
    {
      mode: "core",
      label: "3 Tasks",
      description: "Adds voice response.",
    },
    {
      mode: "full",
      label: "4 Tasks",
      description: "Adds untimed math questions.",
    },
  ];

  return (
    <SharedModeSelection<
      MultitaskingAssessmentConfig,
      MultitaskingAssessmentDifficulty
    >
      subtitle="A timed MATB-style run with gauge monitoring, coordinate grid memory, voice response, and optional math questions."
      topicSlug="multitasking-assessment"
      defaultQuestionCount={4}
      sliderLabel="Session Length"
      sliderMin={1}
      sliderMax={6}
      sliderStep={1}
      sliderLabels={[1, 2, 3, 4, 5, 6]}
      formatSliderLabel={(value) => `${value} min`}
      showQuestionCount={(selectedMode) => selectedMode !== "real"}
      sliderHelperText={(value) =>
        `${value} minute${value === 1 ? "" : "s"} of continuous tasking`
      }
      formatRealModeTime={() => "6 minutes"}
      showDifficulty={false}
      learnDescription="Run a shorter practice session with the same task panels and score breakdown."
      realDescription={(_count, time) =>
        `A recorded assessment run. ${time}. Only this quest now contributes to the multitasking dashboard score.`
      }
      startLabel="Start Assessment"
      loadingLabel="Preparing..."
      childrenBeforeDifficulty={({ isLoading, selectedMode }) => (
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
                  2. Use the coordinate grid and signal dots.
                </span>{" "}
                Rows are A-J and columns are 1-10. Cells are blank on purpose.
                Green signal dots show real requested cells. Red dots can show
                fake coordinates. You may remember green cells and click them
                later; order and timing do not matter.
              </div>
              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-white/5">
                <span className="font-bold text-zinc-900 dark:text-white">
                  3. Answer voice prompts.
                </span>{" "}
                The quiz speaks random arithmetic aloud, gives you a short
                thinking gap, then listens. Say the numeric answer clearly.
              </div>
              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-white/5">
                <span className="font-bold text-zinc-900 dark:text-white">
                  4. Fill math boxes.
                </span>{" "}
                In Full 4, all mixed questions are visible at once: 3-digit
                add/subtract plus 2-digit multiply and clean division. Fill
                boxes before the session ends; there is no Submit button.
              </div>
            </div>
          </div>

          {selectedMode === "learn" ? (
            <div className="mb-8 rounded-2xl border-2 border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black/40">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                Learn Task Set
              </label>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {taskSetOptions.map((option) => (
                  <button
                    key={option.mode}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setAssessmentMode(option.mode)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm font-bold transition ${
                      assessmentMode === option.mode
                        ? "border-brand-purple bg-violet-50 text-brand-purple dark:border-brand-gold dark:bg-brand-gold/10 dark:text-brand-gold"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/10"
                    }`}
                  >
                    <span className="block">{option.label}</span>
                    <span className="mt-1 block text-xs font-medium leading-4 text-zinc-500 dark:text-zinc-400">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Real mode uses the standard 4-task assessment.
              </p>
            </div>
          ) : null}
        </>
      )}
      onFetch={async (mode, _difficulty, sessionLengthMinutes) => ({
        mode,
        difficulty: "medium",
        sessionLengthSeconds: mode === "real" ? 6 * 60 : sessionLengthMinutes * 60,
        assessmentMode: mode === "real" ? "full" : assessmentMode,
        ownId: "MATB",
      })}
      onStart={onStart}
    />
  );
}
