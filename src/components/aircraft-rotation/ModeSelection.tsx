"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import type { SpatialOrientationQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: SpatialOrientationQuizResponse) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  return (
    <SharedModeSelection<SpatialOrientationQuizResponse>
      subtitle="Calculate aircraft heading changes and rotations"
      defaultQuestionCount={20}
      timePerQuestion={15}
      learnDescription="Learn at your own pace with interactive 3D visualizers and animated feedback loops."
      realDescription={(count, _time) =>
        `Test your math speed under time pressure. Answer ${count} rapid-fire format questions.`
      }
      onFetch={async (mode, difficulty, count) => {
        const { generateSpatialOrientationQuiz } = await import(
          "@/lib/aircraft-rotation-generator"
        );
        return generateSpatialOrientationQuiz(count, mode, difficulty);
      }}
      onStart={onStart}
    />
  );
}
