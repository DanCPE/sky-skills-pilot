"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import { generateMissingCubeQuiz } from "@/lib/missing-cube-generator";
import type { MissingCubeQuizResponse } from "@/types";

function formatRealModeTime(questionCount: number) {
  const seconds = questionCount * 72;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (remaining === 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""} ${remaining} seconds`;
}

export default function ModeSelection({
  onStart,
}: {
  onStart: (quizData: MissingCubeQuizResponse) => void;
}) {
  return (
    <SharedModeSelection<MissingCubeQuizResponse>
      topicSlug="missing-cube"
      subtitle="Rotate incomplete cube fragments in your head and choose the only piece that completes the solid cube."
      defaultQuestionCount={10}
      sliderMin={5}
      sliderMax={25}
      sliderStep={5}
      sliderLabels={[5, 10, 15, 20, 25]}
      timePerQuestion={72}
      formatRealModeTime={formatRealModeTime}
      learnDescription="Study each cube with no timer. Rotate the models, compare the choices, and review how the missing piece completes the cube."
      realDescription={(count, timeDisplay) =>
        `Solve ${count} incomplete cubes under time pressure. ${timeDisplay}. Harder questions split the cube into more fragments and start from tilted angles.`
      }
      onFetch={async (mode, difficulty, count) =>
        generateMissingCubeQuiz(count, mode, difficulty)
      }
      onStart={onStart}
    />
  );
}
