"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import { generateFindSimilarShapeQuiz } from "@/lib/find-similar-shape-generator";
import type { FindSimilarShapeQuizResponse } from "@/types";

function formatRealModeTime(questionCount: number) {
  const seconds = questionCount * 14;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes === 0) return `${remaining} seconds`;
  if (remaining === 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""} ${remaining} seconds`;
}

export default function ModeSelection({
  onStart,
}: {
  onStart: (quizData: FindSimilarShapeQuizResponse) => void;
}) {
  return (
    <SharedModeSelection<FindSimilarShapeQuizResponse>
      topicSlug="find-similar-shape"
      subtitle="Compare the target shape against near-matching choices and find the exact same internal layout."
      defaultQuestionCount={10}
      sliderMin={5}
      sliderMax={25}
      sliderStep={5}
      sliderLabels={[5, 10, 15, 20, 25]}
      timePerQuestion={14}
      formatRealModeTime={formatRealModeTime}
      learnDescription="Work without a timer. Inspect the target shape and compare its internal boundaries against each choice."
      realDescription={(count, timeDisplay) =>
        `Solve ${count} visual matching puzzles under time pressure. ${timeDisplay}. Harder questions use more complex outlines and subtler boundary shifts.`
      }
      onFetch={async (mode, difficulty, count) =>
        generateFindSimilarShapeQuiz(count, mode, difficulty)
      }
      onStart={onStart}
    />
  );
}
