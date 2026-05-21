"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import type { ScanningPracticeQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: ScanningPracticeQuizResponse) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  return (
    <SharedModeSelection<ScanningPracticeQuizResponse>
      subtitle="Practice quick visual comparison for pilot aptitude tests"
      defaultQuestionCount={40}
      timePerQuestion={6}
      realDescription={(_count, time) =>
        `Test your skills under time pressure. ${time}. See your score and timing at the end to track your improvement.`
      }
      onFetch={async (mode, difficulty, count) => {
        const params = new URLSearchParams({
          mode,
          difficulty,
          count: String(count),
        });
        const response = await fetch(
          `/api/string-comparison/questions?${params}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load questions");
        }
        return response.json() as Promise<ScanningPracticeQuizResponse>;
      }}
      onStart={onStart}
    />
  );
}
