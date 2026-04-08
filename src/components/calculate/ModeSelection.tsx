"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import type { CalculationQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: CalculationQuizResponse) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  return (
    <SharedModeSelection<CalculationQuizResponse>
      subtitle="Select a mode and difficulty to practice basic calculations"
      defaultQuestionCount={20}
      formatRealModeTime={(count) => (count >= 40 ? "5 minutes" : "3 minutes")}
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
