"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import type { CalculationQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: CalculationQuizResponse) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  return (
    <SharedModeSelection<CalculationQuizResponse>
      topicSlug="calculate"
      subtitle="Select a mode and difficulty to practice basic calculations"
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
        const response = await fetch(`/api/calculate/questions?${params}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load questions");
        }
        return response.json() as Promise<CalculationQuizResponse>;
      }}
      onStart={onStart}
    />
  );
}
