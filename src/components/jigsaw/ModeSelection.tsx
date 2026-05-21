"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import { generateJigsawQuiz } from "@/lib/jigsaw-generator";
import type { JigsawQuizResponse } from "@/types";

function formatRealModeTime(questionCount: number) {
  const seconds = questionCount * 55;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes === 0) return `${remaining} seconds`;
  if (remaining === 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""} ${remaining} seconds`;
}

export default function ModeSelection({
  onStart,
}: {
  onStart: (quizData: JigsawQuizResponse) => void;
}) {
  return (
    <SharedModeSelection<JigsawQuizResponse>
      topicSlug="jigsaw"
      subtitle="Inspect separate flat shape parts and choose the silhouette they form when assembled."
      defaultQuestionCount={10}
      sliderMin={5}
      sliderMax={25}
      sliderStep={5}
      sliderLabels={[5, 10, 15, 20, 25]}
      timePerQuestion={55}
      formatRealModeTime={formatRealModeTime}
      learnDescription="Work without a timer. Compare the loose parts against each assembled silhouette and build the combined outline in your head."
      realDescription={(count, timeDisplay) =>
        `Solve ${count} mental assembly puzzles under time pressure. ${timeDisplay}. Harder questions add more pieces and rotated parts.`
      }
      onFetch={async (mode, difficulty, count) =>
        generateJigsawQuiz(count, mode, difficulty)
      }
      onStart={onStart}
    />
  );
}
