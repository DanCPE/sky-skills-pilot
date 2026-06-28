"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import type { NumberSeriesQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: NumberSeriesQuizResponse) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  return (
    <SharedModeSelection<NumberSeriesQuizResponse>
      topicSlug="number-series"
      subtitle="Select a mode and difficulty to start practicing number series"
      defaultQuestionCount={20}
      formatRealModeTime={(count) => {
          const totalSeconds = count * 21;
          const minutes = Math.floor(totalSeconds / 60);
          const remaining = totalSeconds % 60;
          if (minutes === 0) return `${remaining} seconds`;
          if (remaining === 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
          return `${minutes} minute${minutes !== 1 ? "s" : ""} ${remaining} seconds`;
        }}
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
