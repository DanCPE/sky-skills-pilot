"use client";

import { useState } from "react";
import SharedModeSelection from "@/components/shared/ModeSelection";
import QuestionCountSlider from "@/components/shared/QuestionCountSlider";
import type { PassageRecallQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: PassageRecallQuizResponse) => void;
}

function formatReadingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes} minute${minutes === 1 ? "" : "s"}${remaining ? ` ${remaining} seconds` : ""}`;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  const [readingSeconds, setReadingSeconds] = useState(120);

  return (
    <SharedModeSelection<PassageRecallQuizResponse>
      subtitle="Read one aviation passage, complete the math distraction, then recall the details after it disappears."
      topicSlug="passage-recall"
      showDifficulty={false}
      showQuestionCount={false}
      learnDescription="Practice with a customizable reading window before the passage is wiped and recall begins."
      realDescription={() =>
        "Match the assessment-style setup with a fixed 120-second reading phase before recall."
      }
      formatRealModeTime={() => "Locked at 2 minutes"}
      loadingLabel="Generating Passage..."
      childrenBeforeDifficulty={({ selectedMode, isLoading }) => (
        <>
          {selectedMode === "learn" && (
            <QuestionCountSlider
              value={readingSeconds}
              min={60}
              max={300}
              step={30}
              onChange={setReadingSeconds}
              labels={[60, 120, 180, 240, 300]}
              isLoading={isLoading}
              title="Reading Time"
              helperText={formatReadingTime(readingSeconds)}
              formatLabel={(value) => `${value / 60}m`}
            />
          )}

          <div className="mb-8 rounded-2xl border-2 border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  1. Read
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Memorize the generated aviation passage during a{" "}
                  {selectedMode === "real" ? "fixed 120-second" : "custom"} timer.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  2. Distract
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  When time is up, the passage is removed from state and replaced by 3 math questions.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  3. Recall
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Answer multiple-choice questions built from the exact passage you read.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
      onFetch={async (mode) => {
        const params = new URLSearchParams({
          mode,
          duration: String(mode === "real" ? 120 : readingSeconds),
        });
        const response = await fetch(`/api/passage-recall/questions?${params}`);

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error ?? "Failed to load passage recall quiz");
        }

        return (await response.json()) as PassageRecallQuizResponse;
      }}
      onStart={onStart}
    />
  );
}
