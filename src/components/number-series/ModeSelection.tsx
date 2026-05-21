"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import type { NumberSeriesQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: NumberSeriesQuizResponse) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  return (
    <SharedModeSelection<NumberSeriesQuizResponse>
      subtitle="Select a mode and difficulty to start practicing number series"
      defaultQuestionCount={20}
      formatRealModeTime={(count) => `${(count / 10) * 5} minutes`}
      onFetch={async (mode, difficulty, count) => {
        const params = new URLSearchParams({
          mode,
          difficulty,
          count: String(count),
        });
        const response = await fetch(
          `/api/number-series/questions?${params}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load questions");
        }
        return response.json() as Promise<NumberSeriesQuizResponse>;
      }}
      onStart={onStart}
    />
  );
}
