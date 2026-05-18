"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import type { ApproximationQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: ApproximationQuizResponse) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  return (
    <SharedModeSelection<ApproximationQuizResponse>
      topicSlug="approximation"
      subtitle="Select a mode and difficulty to practice estimation across mixed numerical scenarios"
      defaultQuestionCount={20}
      formatRealModeTime={(count) => `${Math.ceil((count * 13.71) / 60)} minutes`}
      onFetch={async (mode, difficulty, count) => {
        const params = new URLSearchParams({
          mode,
          difficulty,
          count: String(count),
        });
        const response = await fetch(`/api/approximation/questions?${params}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load questions");
        }
        return response.json() as Promise<ApproximationQuizResponse>;
      }}
      onStart={onStart}
    />
  );
}
