"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import type { MissingOperatorQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: MissingOperatorQuizResponse) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  return (
    <SharedModeSelection<MissingOperatorQuizResponse>
      subtitle="Select a mode and difficulty to practice basic calculations"
      defaultQuestionCount={20}
      formatRealModeTime={(count) => `${(count / 10) * 5} minutes`}
      onFetch={async (mode, difficulty, count) => {
        const params = new URLSearchParams({
          mode,
          difficulty,
          count: String(count),
        });
        const response = await fetch(`/api/missing-operator/questions?${params}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load questions");
        }
        return response.json() as Promise<MissingOperatorQuizResponse>;
      }}
      onStart={onStart}
    />
  );
}
