"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/missing-cube/ModeSelection";
import QuizInterface from "@/components/missing-cube/QuizInterface";
import type { MissingCubeQuizResponse } from "@/types";

export default function MissingCubePage() {
  const [quizData, setQuizData] = useState<MissingCubeQuizResponse | null>(null);

  if (quizData) {
    return <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />;
  }

  return (
    <TopicLayout
      title="Missing Cube"
      description="Choose the missing 3D piece that completes the cube."
      fullWidth={true}
      showBackLink={true}
    >
      <ModeSelection onStart={setQuizData} />
    </TopicLayout>
  );
}
