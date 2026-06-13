"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import { generateBoxUnfoldingQuiz } from "@/lib/box-folding-generator";
import type { BoxFoldingQuizResponse } from "@/types";

function formatRealModeTime(questionCount: number) {
  const seconds = questionCount * 54;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (remaining === 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""} ${remaining} seconds`;
}

export default function ModeSelection({
  onStart,
}: {
  onStart: (quizData: BoxFoldingQuizResponse) => void;
}) {
  return (
    <SharedModeSelection<BoxFoldingQuizResponse>
      subtitle="Study the folded cube, then choose the only flat net that can unfold from it."
      defaultQuestionCount={10}
      sliderMin={5}
      sliderMax={25}
      sliderStep={5}
      sliderLabels={[5, 10, 15, 20, 25]}
      timePerQuestion={54}
      formatRealModeTime={formatRealModeTime}
      learnDescription="Work without a timer. Rotate the cube, compare every net, and review the valid unfolding afterward."
      realDescription={(count, timeDisplay) =>
        `Solve ${count} box-unfolding puzzles under time pressure. ${timeDisplay}. Harder questions use more directional markings.`
      }
      onFetch={async (mode, difficulty, count) =>
        generateBoxUnfoldingQuiz(count, mode, difficulty)
      }
      onStart={onStart}
    />
  );
}
