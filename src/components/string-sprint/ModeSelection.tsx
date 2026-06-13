"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import type { StringSprintQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: StringSprintQuizResponse) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  return (
    <SharedModeSelection<StringSprintQuizResponse>
      topicSlug="string-sprint"
      subtitle="Make same-or-different calls under a tight speed clock"
      defaultQuestionCount={40}
      timePerQuestion={2}
      learnDescription="Practice the same-or-different rhythm with instant feedback before turning on the sprint timer."
      realDescription={(_count, time) =>
        `Race the clock. ${time}. Answer fast, keep accuracy high, and review misses at the end.`
      }
      onFetch={async (mode, difficulty, count) => {
        const params = new URLSearchParams({
          mode,
          difficulty,
          count: String(count),
        });
        const response = await fetch(
          `/api/string-sprint/questions?${params}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load questions");
        }
        return response.json() as Promise<StringSprintQuizResponse>;
      }}
      onStart={onStart}
    />
  );
}
